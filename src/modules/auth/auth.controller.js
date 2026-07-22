import * as authService from './auth.service.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { prisma } from '../../config/database.js';
import { loginSchema, registerSchema, checkPasswordSchema } from './auth.validator.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as authenticationService from '../../services/authentication.service.js';


export const registerAgency = async (req, res, next) => {
    try {
        // console.log(req.body);
        const payload = registerSchema.safeParse(req.body);
        if (!payload.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                payload.error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            )
        }
        // console.log(payload)
        const serviceResult = await authService.createRegisterAgency(payload.data);

        return successResponse(
            res,
            201,
            'Travel agency and corporate administration profile onboarded successfully.',
            serviceResult

        )

    } catch (error) {
        // ← Fixed: consistent variable name
        console.error('Registration Error:', error);
        return next(error);
    }
};


export const loginUser = async (req, res, next) => {

    try {
        const payload = loginSchema.safeParse(req.body);
        if (!payload.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                payload.error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            )
        }

        const authenticationData = await authService.agencyLogin(payload.data);

        // return successResponse(
        //     res,
        //     200,
        //     success,
        //     'Authentication handshake successful.',
        //     authenticationData,
        // )

        return res.status(200).json({
            success: true,
            message: 'Authentication handshake successful.',
            data: authenticationData,
        })

    } catch (error) {
        console.error(error);
        console.error(error.stack);
        return next(error);
    }
};


export const getCurrentUser = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            throw new AppError(
                401,
                "UNAUTHORIZED",
                "Missing user payload"
            )
        }
        const profile = await authService.getCurrentUser({ userId: req.user.userId });

        return successResponse(
            res,
            200,
            success,
            "Current user retrieved successfully",
            profile,
        )

    } catch (error) {
        next(error);
    }
};



export const changePassword = async (req,res,next) => {

    try{
        if(!req.user){
            throw new AppError(
                401,
                "UNAUTHORIZED",
                "Authentication is required."
            );
        }

        const payload = checkPasswordSchema.safeParse(req.body);

        if(!payload.success){
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                payload.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }))
            );
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
        next(error);
    }

};