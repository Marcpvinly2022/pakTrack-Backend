import crypto from "crypto";
import {prisma} from "../../config/database.js";
import { AppError} from "../../middlewares/errorHandler.js";
import { MasterStatus } from "@prisma/client";
import bcrypt from 'bcrypt';
import {queueNotification} from "../notification/notification.service.js"

export const createClient = async(clientData, authenticatedUser) => {
    const {firstName, lastName, email, phoneNumber, serviceCategoryId} = clientData;
    const {tenantId, userId } = authenticatedUser; 

    // Verify service belongs to this tenant
    const service = await prisma.serviceCategory.findFirst({
        where: {
            id: serviceCategoryId,
            tenantId,
            isActive: true,
        },
    });

    if(!service) {
        throw new AppError(
            404,
            "SERVICE_NOT_FOUND",
            "Selected service category does not exist."
        );
    }

    // Prevent duplicate client email inside the same tenant
    const existingClient = await prisma.client.findFirst({
        where: {
            tenantId,
            email,
            deletedAt: null,
        },
    });

    if(existingClient){
        throw new AppError(
            409,
            "CLIENT_ALREADY EXISTS",
            "A client with this email already exists."
        );
    }
    
    const temporaryPassword = crypto.randomBytes(6).toString("base64url");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const client = await prisma.client.create({
        data: {
            tenantId,
            createdByUserId: userId,
            assignedDeskAgencyId: userId,
            serviceCategoryId,
            firstName,
            lastName,
            email,
            phoneNumber,
            passwordHash,
            mostChangePassword: true,
        },
    });

    return {
        client,
        serviceName: service.serviceName,
        temporaryPassword,
    };
};

