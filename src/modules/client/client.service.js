import crypto from "crypto";
import {prisma} from "../../config/database.js";
import { AppError} from "../../middlewares/errorHandler.js";
import {queueNotification} from "../notification/notification.service.js"
import { hashPassword } from "../../utils/password.js";
import { ROLES } from "../constants/roles.js";
import { authenticateAccount } from "../../services/authentication.service.js";


export const createClient = async(clientData, authenticatedUser) => {
    const {firstName, lastName, email, phoneNumber, serviceCategoryId} = clientData;
    const {tenantId, id:userId } = authenticatedUser; 

    // Verify service belongs to this tenant
    const service = await prisma.serviceCategory.findFirst({
        where: {
            id: serviceCategoryId,
            tenantId,
            isActive: true,
        },
        
        include: {
            tenant:true,
        }
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
    const passwordHash = await hashPassword(temporaryPassword);

    console.log("Temporary Password:", temporaryPassword);
    console.log("Stored Hash:", passwordHash);

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
            mustChangePassword: true,
        },
    });

    return {
        client,
        serviceName: service.serviceName,
        temporaryPassword,
    };
};



export const clientLogin = async ({email, password}) => {
    const user = await prisma.client.findFirst({
        where: {
            email,
            deletedAt: null,
            
        },

        include: {
            tenant: true,
        }

    });

    if(!user){
        throw new AppError(
            401,
            "INVALID_CREDENTIALS",
            "Invalid email or password."
            )
        }

console.log("===== CLIENT LOGIN =====");
    console.log("Password received:", password);
    console.log("User email:", user.email);
    console.log("authenticateAccount:", authenticateAccount);
    const token = await authenticateAccount({
        account: user,
        password,
        accountType: "CLIENT",
    });

    

    return {
        token, 
        profile: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: ROLES.TRAVELLER,
            agencyName: user.tenant.agencyName,
            subdomain: user.tenant.subdomain,


        }
    }
}
