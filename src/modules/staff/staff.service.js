import bcrypt from "bcrypt";
import {prisma} from "../../config/database.js";
import {AppError} from "../../middlewares/errorHandler.js";
import { ROLES } from "../constants/roles.js";

const SALT_ROUNDS = 12;

//Create Staff
export const createStaff = async ({tenantId, email, password, role}) => {
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

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const staff = await prisma.user.create({
        data:{
            tenantId,
            email,
            passwordHash,
            role,
        },

        select: {
            id:true,
            email:true,
            role:true,
            isActive:true,
            createdAt:true,
        },
    });

    return staff;
};

//get all staff
export const getAllStaff = async ({tenantId}) => {
    const staff = await prisma.user.findMany({
        where:{
            tenantId,
            role: ROLES.DESK_AGENT,
        },

        select: {
             id:true,
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