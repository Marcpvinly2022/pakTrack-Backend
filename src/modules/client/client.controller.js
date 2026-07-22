import * as clientService from "./client.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { checkPasswordSchema, createClientSchema, loginClientSchema } from "./client.validator.js";
import { prisma } from "../../config/database.js";
import { queueNotification } from "../notification/notification.service.js"
import { successResponse } from "../../utils/apiResponse.js";

import * as authenticationService from "../../services/authentication.service.js";
import { success } from "zod";

export const createClient = async (req, res, next) => {
    try {
        const payload = createClientSchema.safeParse(req.body)
        if (!payload.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                payload.error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }))
            );

        }

        if (!req.user) {
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
                id: req.user.tenantId,
            },
        });
        //load the desk agent
        const deskAgent = await prisma.user.findUnique({
            where: {
                id: req.user.id
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
                deskAgent: `${deskAgent.firstName} ${deskAgent.lastName}`,
                serviceName: result.serviceName,
                email: result.client.email,
                temporaryPassword: result.temporaryPassword,
            }
        })

        return successResponse(
            res,
            201,
            "Client Created Successfully.",
            result.client
        );


    } catch (error) {
        next(error);
    }
};

export const clientLogin = async(req, res, next) => {
    try{
        const payload = loginClientSchema.safeParse(req.body);
        if(!payload.success){
            throw new AppError(
                 401,
                "VALIDATION_ERROR",
                payload.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
                }))
            )
        }


        const clientData = await clientService.clientLogin(payload.data)

        // return successResponse(
        //     res,
        //     200,
        //     "Client Login Successfully",
        //     clientData,
        // )

        return res.status(200).json({
            success:true,
            message: "Client login successsfully",
            data: clientData,
        })
       
    }catch(error){
        next(error)
    }
}


export const changePassword = async(req,res, next) => {
    try{
        if(!req.body){
            throw new AppError(

            )
        }

        const payload = checkPasswordSchema.safeParse(req.body);

        if(!payload.success){
            throw new AppError(
                401,
                "VALIDATION_ERROR",
                payload.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            )
        }

        await authenticationService.changePassword({
        model: req.user.type === "CLIENT" ? "client" : "user",
        id: req.user.id,
        currentPassword: payload.data.currentPassword,
        newPassword: payload.data.newPassword,
    });

         return successResponse(
            res,
            200,
            "Password changed Successfully. ",
        )

    }catch(error){
        next(error)
    }
    
}