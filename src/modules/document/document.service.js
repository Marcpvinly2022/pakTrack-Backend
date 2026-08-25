import { application } from "express";
import {prisma} from "../../config/database.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { createAuditLog } from "../../services/auditLog.service.js";
import { ROLES } from "../constants/roles.js";
import { version } from "react";

/**
 * Resolve the application (ClientService) with tenant + row scoping.
 * - AGENCY_ADMIN: any case in the tenant.
 * - DESK_AGENT: only cases whose client is assigned to them.
 * Anything outside that scope returns 404 (never 403) so we don't leak
 * the existence of other tenants'/agents' cases.
 */

const resolveCase = async ({ tenantId, applicationId, actorId, actorType}) => {
    const where = {
        id: applicationId,
        tenantId,
        deletedAt: null,
    };

    if(actorType === ROLES.DESK_AGENT){
        where.client =  {assignedDeskAgentId: actorId};
    }

    const ClientService = await prisma.ClientService.findFirst({where});

    if(!ClientService){
        throw new AppError(
            404,
            "APPLICATION_NOT_FOUND",
            "Application not found"

        );
    }

    return ClientService;


};


// POST /applications/:applicationId/document-requirements
export const createRequirement = async({
    tenantId,
    applicationId,
    actorId,
    actorType,
    title,
    instruction,
    isRequired,
    displayOrder,
}) => {
    await resolveCase({tenantId, applicationId, actorId, actorType});

    return prisma.$transaction(async (tx) => {
        const requirement = await tx.documentRequirement.create({
            data: {
                tenantId,
                clientServiceId: applicationId,
                title,
                instruction,
                isRequired,
                displayOrder,
                createdByUserId: actorId,
            },
        });

        await createAuditLog({
            prisma: tx,
            actorId,
            actorType,
            action: "CREATE",
            resource: "DOCUMENT_REQUIREMENT",
            resourceId: requirement.id,
            status: "SUCCESS",
            metadata:{
                clientServiceId: applicationId,
                title: requirement.title,
                isRequired: requirement.isRequired,
            },
        });

        return requirement

    })
}


// GET /applications/:applicationId/document-requirements
export const listRequirements = async({
    tenantId,
    applicationId,
    actorId,
    actorType,
    status,
}) => {
    await resolveCase({tenantId, applicationId, actorId, actorType});

    return prisma.documentRequirement.findMany({
        where: {
            tenantId,
            clientServiceId: applicationId,
            deletedAt: null,
            ...(status && {status}),
        },

        orderBy: [{ displayOrder: "asc"}, {createdAt: 'asc'}],
        include:{
            // Latest-first slice of uploads so the checklist row shows current state
            documents: {
                where: {deletedAt: null},
                orderBy: {version: "desc"},
                select:{
                    id: true,
                    version: true,
                    status: true,
                    originalFileName: true,
                    createdAt: true,
                },
            },
        },
    });
};


