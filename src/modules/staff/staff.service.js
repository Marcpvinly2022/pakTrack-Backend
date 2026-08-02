import {prisma} from "../../config/database.js";
import {AppError} from "../../middlewares/errorHandler.js";
import { ROLES } from "../constants/roles.js";
import { hashPassword } from "../../utils/password.js";
import { authenticateAccount } from "../../services/authentication.service.js";


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


export const staffLogin = async ({email, password}) => {
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
        password,
        accountType: "USER",
    })

    return {
    ...tokens,
    profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.role,
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


//update staff status
export const updateStaffStatus = async ({tenantId, staffId, isActive}) => {
    //Multi-Tenant Security Check
    const staff = await prisma.user.findFirst({
        where: {
            id: staffId,
            tenantId,
            role: ROLES.DESK_AGENT,
        },
    });

    if(!staff){
        throw new AppError(
            404,
            "STAFF_NOT_FOUND",
            "Staff member not found."
        );
    }

    const updatedStaff = await prisma.user.update({
        where: {
            id: staff.id,
        },

        data: {
            isActive,
        },

        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
        },
    });

    return updatedStaff;
}