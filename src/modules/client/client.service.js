import crypto from "crypto";
import { prisma } from "../../config/database.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { ROLES } from "../constants/roles.js";
import { hashPassword } from "../../utils/password.js";
import { createAuditLog } from "../../services/auditLog.service.js";
import { assertAssignableDeskAgent } from "../staff/staff.service.js";
import { authenticateAccount } from "../../services/authentication.service.js";
import { Role } from "@prisma/client";

export const createClient = async ({
  tenantId,
  actorId,
  actorRole,
  firstName,
  lastName,
  email,
  phoneNumber,
  assignedDeskAgentId,
  ipAddress,
  userAgent,
}) => {
  // Admin must name a desk agent; a desk agent omitting it owns the client itself.
  const resolvedDeskAgentId =
    assignedDeskAgentId ?? (actorRole === ROLES.DESK_AGENT ? actorId : null);

  if (!resolvedDeskAgentId) {
    throw new AppError(
      422,
      "DESK_AGENT_REQUIRED",
      "An assigned desk agent is required when creating a client.",
    );
  }

  // One-time temp password; only the hash is persisted.
  const temporaryPassword = crypto.randomBytes(6).toString("base64url");
  const passwordHash = await hashPassword(temporaryPassword);

  const { client, deskAgentName } = await prisma.$transaction(async (tx) => {
    // Tenant-scoped duplicate check (Client has no DB unique on email yet).
    const existingClient = await tx.client.findFirst({
      where: { tenantId, email, deletedAt: null },
      select: { id: true },
    });
    if (existingClient) {
      throw new AppError(
        409,
        "CLIENT_ALREADY_EXISTS",
        "A client with this email already exists in your agency.",
      );
    }

    // Desk agent must be a valid, active DESK_AGENT in this tenant.
    const deskAgent = await assertAssignableDeskAgent({
      tenantId,
      deskAgentId: resolvedDeskAgentId,
      tx,
    });

    // Client + initial assignment-history row, one atomic nested write.
    const created = await tx.client.create({
      data: {
        tenantId,
        email,
        phoneNumber,
        firstName,
        lastName,
        passwordHash,
        mustChangePassword: true,
        accountStatus: "INVITED",
        createdByUserId: actorId,
        assignedDeskAgentId: resolvedDeskAgentId,
        // isActive omitted → schema default false (client is inactive until onboarding).

        assignmentHistory: {
          create: {
            tenantId,
            previousDeskAgentId: null,
            newDeskAgentId: resolvedDeskAgentId,
            reassignedById: actorId,
            reason: "INITIAL_ASSIGNMENT",
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        accountStatus: true,
        assignedDeskAgentId: true,
        createdAt: true,
      },
    });

    // Audit inside the tx; createAuditLog swallows its own errors, so it can't roll you back.
    await createAuditLog({
      prisma: tx,
      actorId,
      actorType: "USER",
      action: "CREATE",
      resource: "CLIENT",
      resourceId: created.id,
      status: "SUCCESS",
      ipAddress,
      userAgent,
      metadata: { assignedDeskAgentId: resolvedDeskAgentId },
    });

    return {
      client: created,
      deskAgentName:
        `${deskAgent.firstName ?? ""} ${deskAgent.lastName ?? ""}`.trim(),
    };
  });

  return { client, temporaryPassword, deskAgentName };
};

// login client
export const clientLogin = async ({ email, password, req }) => {
  // No tenant scoping and NO isActive filter here — a brand-new INVITED client
  // (isActive:false) MUST be able to log in with the temp password to onboard.
  const client = await prisma.client.findFirst({
    where: { email, deletedAt: null },
    include: { tenant: true },
  });

  if (!client) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );
  }

  // INVITED → allowed (needs onboarding). ACTIVE → allowed. DISABLED → blocked.
  if (client.accountStatus === "DISABLED") {
    throw new AppError(
      403,
      "ACCOUNT_DISABLED",
      "This client account has been disabled.",
    );
  }

  // authenticateAccount checks lockout, verifies the password, records the
  // audit trail, mints the token pair, and stamps lastLoginAt.

  const tokens = await authenticateAccount({
    account: client,
    password,
    portal: "CLIENT",
    req,
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    profile: {
      id: client.id,
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      tenantId: client.tenantId,
      accountStatus: client.accountStatus,
      mustChangePassword: client.mustChangePassword,
      agencyName: client.tenant?.agencyName ?? null,
      subdomain: client.tenant?.subdomain ?? null,
    },
  };
};

export const createApplication = async ({
  tenantId,
  actorId,
  clientId,
  serviceId,
  ipAddress,
  userAgent,
}) => {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.findFirst({
      where: {
        id: clientId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!client) {
      throw new AppError(
        404,
        "CLIENT_NOT_FOUND",
        "Client not found in your agency.",
      );
    }

    const service = await tx.service.findFirst({
      where: {
        id: serviceId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!service) {
      throw new AppError(
        422,
        "INVALID_SERVICE",
        "Selected service does not exist, is inactive, or belongs to another agency.",
      );
    }

    const existing = await tx.clientService.findFirst({
      where: {
        clientId,
        serviceId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new AppError(
        409,
        "APPLICATION_ALREADY_EXISTS",
        "This client already has an application for the selected service.",
      );
    }

    const application = await tx.clientService.create({
      data: {
        tenantId,
        clientId,
        serviceId,
        createdByUserId: actorId,
      },
      select: {
        id: true,
        clientId: true,
        serviceId: true,
        status: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      prisma: tx,
      actorId,
      actorType: "USER",
      action: "CREATE",
      resource: "CLIENT_SERVICE",
      resourceId: application.id,
      status: "SUCCESS",
      ipAddress,
      userAgent,
      metadata: {
        clientId,
        serviceId,
      },
    });

    return {
      application,
      serviceName: service.name,
    };
  });
};

export const getClients = async ({
  tenantId,
  actorId,
  actorRole,
  page,
  limit,
  status,
  search,
}) => {
  const where = {
    tenantId, // ← tenant isolation, ALWAYS from req.user
    deletedAt: null, // Client soft-deletes, so exclude removed rows
  };

  // ── Row-level scoping (delete this block to let agents see the whole agency) ──
  if (actorRole === ROLES.DESK_AGENT) {
    where.assignedDeskAgentId = actorId;
  }

  if (status) {
    where.accountStatus = status;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  // One round-trip: the page of rows + the total for pagination math.
  const [clients, total] = await prisma.$transaction([
    prisma.client.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        accountStatus: true,
        isActive: true,
        createdAt: true,
        assignedDeskAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          // Filtered count → active applications only, not soft-deleted ones.
          select: { clientServices: { where: { deletedAt: null } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  return {
    clients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getClientById = async ({
  tenantId,
  actorId,
  actorRole,
  clientId,
}) => {
  const where = {
    id: clientId,
    tenantId, // ← other-tenant client falls through to 404, not a leak
    deletedAt: null,
  };

  // Same scoping rule as the list: an agent can only open their own client.
  if (actorRole === Role.DESK_AGENT) {
    where.assignedDeskAgentId = actorId;
  }

  const client = await prisma.client.findFirst({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      accountStatus: true,
      isActive: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      assignedDeskAgent: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      clientServices: {
        where: { deletedAt: null },
        select: {
          id: true,
          status: true,
          masterStatus: true,
          createdAt: true,
          service: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      // Append-only ownership trail — who held this client, who moved them, and why.
      assignmentHistory: {
        select: {
          id: true,
          reason: true,
          notes: true,
          createdAt: true,
          previousDeskAgent: {
            select: { id: true, firstName: true, lastName: true },
          },
          newDeskAgent: {
            select: { id: true, firstName: true, lastName: true },
          },
          reassignedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    throw new AppError(
      404,
      "CLIENT_NOT_FOUND",
      "Client not found in your agency.",
    );
  }

  return client;
};

//reassignClient
export const reassignClient = async ({
  tenantId,
  actorId,
  clientId,
  newDeskAgentId,
  reason,
  notes,
  ipAddress,
  userAgent,
}) => {
  return prisma.$transaction(async (tx) => {
    // Tenant-gate the client first — wrong tenant / missing → 404, no leak.
    const client = await tx.client.findFirst({
      where: { id: clientId, tenantId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        assignedDeskAgentId: true,
      },
    });

    if (!client) {
      throw new AppError(
        404,
        "CLIENT_NOT_FOUND",
        "Client not found in your agency.",
      );
    }

    // No-op guard: reassigning to the current owner would write a junk history
    // row where previous === new. Reject it.

    if (client.assignedDeskAgentId === newDeskAgentId) {
      throw new AppError(
        409,
        "ALREADY_ASSIGNED",
        "This client is already assigned to that desk agent.",
      );
    }

    // Inheritor must be a real, ACTIVE desk agent in THIS tenant → 422 if not.
    const newAgent = await assertAssignableDeskAgent({
      tenantId,
      deskAgentId: newDeskAgentId,
      tx,
    });

    const previousDeskAgentId = client.assignedDeskAgentId;

    // 1) Move the current pointer.
    const updated = await tx.client.update({
      where: { id: clientId },
      data: { assignedDeskAgentId: newDeskAgentId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        assignedDeskAgentId: true,
      },
    });

    // Append the immutable history row.
    await tx.clientAssignment.create({
      data: {
        tenantId,
        clientId,
        previousDeskAgentId,
        newDeskAgentId,
        reassignedById: actorId,
        reason,
        notes: notes ?? null,
      },
    });

    // 3) Audit inside the tx (swallows its own errors, can't roll you back).
    await createAuditLog({
      prisma: tx,
      actorId,
      actorType: "USER",
      action: "REASSIGN",
      resource: "CLIENT",
      resourceId: client.id,
      status: "SUCCESS",
      ipAddress,
      userAgent,
      metadata: { previousDeskAgentId, newDeskAgentId, reason },
    });

    return {
      client: updated,
      newDeskAgentName: `${newAgent.firstName ?? ""} ${newAgent.lastName ?? ""}`.trim(),
    };
  });
};