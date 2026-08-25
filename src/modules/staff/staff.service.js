import {prisma} from "../../config/database.js";
import {AppError} from "../../middlewares/errorHandler.js";
import { ROLES } from "../constants/roles.js";
import { hashPassword } from "../../utils/password.js";
import { authenticateAccount } from "../../services/authentication.service.js";
import { createAuditLog } from "../../services/auditLog.service.js";
import { revokeAllSessions } from "../../services/session.service.js";
//Create Staff
export const createStaff = async ({tenantId, email, firstName, lastName, password, role}) => {
    //prevent duplicate email inside the same tenant
    const existingStaff = await prisma.user.findFirst({
        where: {
            tenantId,
            email,
        },
    });

    if(existingStaff){
        throw new AppError(
            409,
            "EMAIL_ALREADY_EXISTS",
            "A staff member with this email already exists.",
        );
    }

    const passwordHash = await hashPassword(password);

    const staff = await prisma.user.create({
        data:{
            tenantId,
            firstName,
            lastName,
            email,
            passwordHash,
            mustChangePassword: true,
            role,
        },

        select: {
            id:true,
            firstName:true,
            lastName:true,
            email:true,
            role:true,
            isActive:true,
            createdAt:true,
        },
    });

    return {
        staff,
        temporaryPassword: password,
    }
};


export const staffLogin = async ({email, password, req}) => {
    const user = await prisma.user.findFirst({
        where:{
            email,
            isActive: true,
            role:{
                in: [ROLES.AGENCY_ADMIN, ROLES.DESK_AGENT]
            },
        },

        include: {
            tenant: true
        }
    });

    if(!user){
        throw new AppError(
            401,
            "INVALID_CREDENTIALS",
            "Invalid email or password."

        )
    }

    const tokens = await authenticateAccount({
        account: user,
        password: password,
        portal: "STAFF",
        req
    })

    return {
    ...tokens,
    profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        mustChangePassword: user.mustChangePassword,
        agencyName: user.tenant?.agencyName ?? null,
        subdomain: user.tenant?.subdomain ?? null,
    },
};
}



//get all staff
export const getAllStaff = async ({tenantId}) => {
    const staff = await prisma.user.findMany({
        where:{
            tenantId,
            role: ROLES.DESK_AGENT,
        },

        select: {
            id:true,
            firstName: true,
            lastName: true,
            email:true,
            role:true,
            isActive:true,
            lastLoginAt: true,
            createdAt:true
        },

        orderBy: {
            createdAt: "desc",
        },
    });

    return staff;
}


// Validates that a desk agent is real, active, and inside THIS tenant.
// User has NO deletedAt — retirement is isActive only, so never filter deletedAt here.
export const assertAssignableDeskAgent = async ({ tenantId, deskAgentId, tx = prisma }) => {
    const agent = await tx.user.findFirst({
        where: {
            id: deskAgentId,
            tenantId,
            role: ROLES.DESK_AGENT,
            isActive: true,
        },
        select: { id: true, firstName: true, lastName: true },
    });

    if (!agent) {
        throw new AppError(
            422,
            "INVALID_DESK_AGENT",
            "Selected desk agent does not exist, is inactive, or belongs to another agency."
        );
    }

    return agent;
};


export const deactivateDeskAgent = async ({
  tenantId, actorId, deskAgentId, reassignToDeskAgentId, notes, ipAddress, userAgent,
}) => {
  // Can't hand the book to the very agent you're switching off.
  if (deskAgentId === reassignToDeskAgentId) {
    throw new AppError(422, "INVALID_REASSIGNMENT_TARGET",
      "Cannot reassign clients to the desk agent being deactivated.");
  }

  const result = await prisma.$transaction(async (tx) => {
    // The agent being deactivated must be a DESK_AGENT in this tenant.
    const agent = await tx.user.findFirst({
      where: { id: deskAgentId, tenantId, role: ROLES.DESK_AGENT },
      select: { id: true },
    });
    if (!agent) throw new AppError(404, "STAFF_NOT_FOUND", "Desk agent not found.");

    // The inheritor must be a DIFFERENT, active DESK_AGENT in this tenant (422 if not).
    await assertAssignableDeskAgent({ tenantId, deskAgentId: reassignToDeskAgentId, tx });

    // Capture the book BEFORE moving it: updateMany returns only a count, and
    // once repointed we could no longer find these rows by their old owner.
    const clients = await tx.client.findMany({
      where: { assignedDeskAgentId: deskAgentId, tenantId, deletedAt: null },
      select: { id: true },
    });
    const clientIds = clients.map((c) => c.id);

    if (clientIds.length > 0) {
      // Repoint every client in one statement.
      await tx.client.updateMany({
        where: { id: { in: clientIds } },
        data: { assignedDeskAgentId: reassignToDeskAgentId },
      });

      // One immutable history row per moved client.
      await tx.clientAssignment.createMany({
        data: clientIds.map((clientId) => ({
          tenantId,
          clientId,
          previousDeskAgentId: deskAgentId,
          newDeskAgentId: reassignToDeskAgentId,
          reassignedById: actorId,
          reason: "DESK_AGENT_DEACTIVATED",
          notes: notes ?? null,
        })),
      });
    }

    // Switch the agent off + invalidate live access tokens (see the principle above).
    await tx.user.update({
      where: { id: deskAgentId },
      data: { isActive: false, sessionVersion: { increment: 1 } },
    });

    await createAuditLog({
      prisma: tx, actorId, actorType: "USER",
      action: "DEACTIVATE", resource: "USER", resourceId: deskAgentId, status: "SUCCESS",
      ipAddress, userAgent,
      metadata: { reassignedTo: reassignToDeskAgentId, reassignedClientCount: clientIds.length },
    });

    return {
      deactivatedAgentId: deskAgentId,
      reassignedTo: reassignToDeskAgentId,
      reassignedClientCount: clientIds.length,
    };
  });

  // Redis lives outside Postgres — wipe refresh sessions AFTER the tx commits,
  // so a rolled-back deactivation doesn't leave the agent logged out. This is
  // the half that prevents session resurrection on later reactivation.
  await revokeAllSessions(deskAgentId);

  return result;
};



export const updateStaffStatus = async ({ tenantId, staffId, isActive }) => {
    const staff = await prisma.user.findFirst({
        where: { id: staffId, tenantId, role: ROLES.DESK_AGENT },
    });
    if (!staff) {
        throw new AppError(404, "STAFF_NOT_FOUND", "Staff member not found.");
    }

    // Block deactivation here if the agent still owns clients — force the caller
    // through /deactivate, which reassigns them. Reactivation (isActive:true)
    // and deactivating an empty-book agent stay allowed.
    if (isActive === false) {
        const activeClients = await prisma.client.count({
            where: { assignedDeskAgentId: staffId, tenantId, deletedAt: null },
        });
        if (activeClients > 0) {
            throw new AppError(409, "AGENT_HAS_CLIENTS",
                "This desk agent still has assigned clients. Use the deactivate endpoint to reassign them first.");
        }
    }

    const updatedStaff = await prisma.user.update({
        where: { id: staff.id },
        data: { isActive },
        select: { id: true, email: true, role: true, isActive: true },
    });
    return updatedStaff;
};
