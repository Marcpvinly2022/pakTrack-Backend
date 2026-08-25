import { prisma } from "../config/database.js";
import { logger } from "../utils/logger.js";

export const createAuditLog = async ({
    prisma: transactionPrisma,
    actorId = null,
    actorType = null,
    action,
    resource,
    resourceId = null,
    status = "SUCCESS",
    ipAddress = null,
    userAgent = null,
    metadata = null,
}) => {
    try {

        const db = transactionPrisma || prisma;

        const cleanActorId = (typeof actorId === "string" && actorId.trim() !== "") ? actorId : null;
        const cleanResourceId = (typeof resourceId === "string" && resourceId.trim() !== "") ? resourceId : null;
        // ✅ THE CORRECT LOWERCASE HANDSHAKE LINK
        // In the Prisma Client, all model names automatically become lowercase methods!
        return await db.audit.create({
            data: {
                actorId: cleanActorId,
                actorType: actorType ? String(actorType).toUpperCase() : null,
                action: String(action).toUpperCase(),
                resource: String(resource).toUpperCase(),
                resourceId: cleanResourceId,
                status: status ? String(status).toUpperCase() : "SUCCESS",
                ipAddress: ipAddress || "127.0.0.1",
                userAgent: userAgent || "unknown",
                // ✅ SAFETY SHIELD 2: Ensure data maps cleanly to your Json type column
                metadata: metadata ? metadata : undefined,
            }
        });

    } catch (error) {
        console.error("🚨 [Prisma Audit Rejection Core Reason]:", error.message);

        logger.error({
            err: error,
            action,
            resource,
            actorId
        }, "❌ AUDIT_LOG_WRITE_FAILED");
        
        return null;
    }
};
