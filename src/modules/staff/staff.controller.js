import * as staffService from "./staff.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { createStaffSchema, updateStaffSchema, staffIdParamSchema, checkPasswordSchema, loginStaffSchema } from "./staff.validator.js";
import { prisma } from "../../config/database.js";
import {queueNotification} from "../notification/notification.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as authenticationService from "../../services/authentication.service.js";

//create staff
export const createStaff = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new AppError(
                401,
                "UNAUTHORIZED",
                "Authentication is required."
            );
        }

        const payload = createStaffSchema.safeParse(req.body);
        if (!payload.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                payload.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }))
            )
        };

        const result = await staffService.createStaff({
            tenantId: req.user.tenantId,
            ...payload.data,
        });

        const tenant = await prisma.tenant.findUnique({
            where: {
                id:req.user.tenantId,
            },
        });

        if (!tenant) {
            throw new AppError(
                404,
                "TENANT_NOT_FOUND",
                "Tenant does not exist."
            );
        }

        await queueNotification({
            tenantId: req.user.tenantId,
            userId: result.staff.id,
            recipient: result.staff.email,

            subject: "Welcome to PakTrack",

            message:
                `Welcome ${result.staff.firstName} ${result.staff.lastName}. ` +
                `Your temporary password is ${result.temporaryPassword}.`,

            type: "STAFF_ACCOUNT_CREATED",

            payload: {
                agencyName: tenant.agencyName,
                staffName: `${result.staff.firstName} ${result.staff.lastName}`,
                email: result.staff.email,
                temporaryPassword: result.temporaryPassword,
            },
        });

        return successResponse(
            res,
            201,
            "Staff Created Successfully.",
            result.staff
        )

    } catch (error) {
        next(error)
    }
}


export const staffLogin = async (req, res, next) => {
    try{
        

        const payload = loginStaffSchema.safeParse(req.body)

        if(!payload.success){
            throw new AppError(
               400,
                "VALIDATION_ERROR",
                payload.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
                }))
            )
        }


        const staffData = await staffService.staffLogin(payload.data)

        return successResponse(
            res, 
            200,
            "Staff authenticated successfully.",
            staffData,
        )

    }catch(error){
        next(error)
    }
}


//get all staff
export const getAllStaff = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new AppError(
                401,
                "UNAUTHORIZED",
                "Authentication is required."
            );
        }

        const staff = await staffService.getAllStaff({
            tenantId: req.user.tenantId
        });

        return successResponse(
            res,
            200,
            success,
            staff
        )

    } catch (error) {
        next(error);
    }
};


//update staff status 

export const updateStaffStatus = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new AppError(
                401,
                "UNAUTHORIZED",
                "Authentication is required."
            );
        }

        const params = staffIdParamSchema.safeParse(req.params);
        if (!params.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                params.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }))
            );
        }

        const body = updateStaffSchema.safeParse(req.body);

        if (!body.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                body.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }))
            );
        }

        const updatedStaff = await staffService.updateStaffStatus({
            tenantId: req.user.tenantId,
            staffId: params.data.id,
            isActive: body.data.isActive
        });

        return successResponse(
            res,
            200,
            success,
            "Staff member status updated successfully.",
            updatedStaff,

        )
        
    } catch (error) {
        next(error);
    }
};


export const changePassword = async(req, res, next) => {
    try{
        if(!req.body){
            throw new AppError(
                401,
                "UNAUTHORIZED",
                "Authentication is required."

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
            model: req.user.type === "client" ? "client" : "user",
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