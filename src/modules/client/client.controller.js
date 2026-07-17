import * as clientService from "./client.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { createClientSchema } from "./client.validator.js";
import { success } from "zod";
import {prisma} from "../../config/database.js";
import {queueNotification} from "../notification/notification.service.js"

export const createClient = async (req,res,next) => {
    try{
        const payload = createClientSchema.safeParse(req.body)
        if(!payload.success){
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                payload.error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }))
            );

        }

        if(!req.user){
            throw new AppError(
                 401,
                "UNAUTHENTICATED",
                "Authentication required."
            );
        }

        const result = await clientService.createClient(payload.data, req.user);
//load the tenant
        const tenant = await prisma.tenant.findUnique({
            where: {
                id:req.user.tenantId,
            },
        });
//load the desk agent
const deskAgent = await prisma.user.findUnique({
    where: {
        id: req.user.userId
    },
});

await queueNotification({
    tenantId: req.user.tenantId,
    clientId: result.client.id,
    recipient: result.client.email,
    subject: "Welcome to PakTrack",
    type: "CLIENT_ACCOUNT_CREATED",
    message:
    `Welcome ${result.client.firstName}. ` +
    `Your temporary password is ${result.temporaryPassword}.`,

    payload: {
        agencyName: tenant.agencyName,
        clientName: `${result.client.firstName} ${result.client.lastName}`,
        deskAgentName: `${deskAgent.firstName} ${deskAgent.lastName}`,
        serviceName: result.serviceName,
        email: result.client.email,
        temporaryPassword: result.temporaryPassword,
    }
})

        return res.status(201).json({
            success: true,
            message: "client registered successfully.",
            data: result.client,
        });

    }catch(error){
        next(error);
    }
};