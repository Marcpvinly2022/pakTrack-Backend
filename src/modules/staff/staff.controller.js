import * as staffService from "./staff.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { createStaffSchema, updateStaffSchema, staffIdParamSchema } from "./staff.validator.js";
import { success } from "zod";

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

        const staff = await staffService.createStaff({
            tenantId: req.user.tenantId,
            ...payload.data,
        });

        return res.status(201).json({
            success: true,
            message: "Staff created successfully.",
            data: staff,
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