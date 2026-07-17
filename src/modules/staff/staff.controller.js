import * as staffService from "./staff.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { createStaffSchema, updateStaffSchema, staffIdParamSchema } from "./staff.validator.js";
import { success } from "zod";
import { prisma } from "../../config/database.js";
import {queueNotification} from "../notification/notification.service.js";

//create staff
export const createStaff = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new AppError(
                401,
                "AUTHORIZED",
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

        return res.status(201).json({
            success: true,
            message: "Staff created successfully.",
            data: result.staff,
        });

    } catch (error) {
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

        return res.status(200).json({
            success: true,
            data: staff,
        })
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

        return res.status(200).json({
            success: true,
            message: "Staff member status updated successfully.",
            data: updatedStaff
        });
        
    } catch (error) {
        next(error);
    }
};