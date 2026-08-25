import * as authService from './auth.service.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { prisma } from '../../config/database.js';
import { resetPasswordSchema, loginSchema, registerSchema, checkPasswordSchema, forgotPasswordSchema } from './auth.validator.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as authenticationService from '../../services/authentication.service.js';
import { REFRESH_TOKEN_TTL } from '../constants/auth.js';
import * as passwordResetService from '../../services/passwordReset.service.js';
import { createAuditLog } from '../../services/auditLog.service.js';
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

        const authenticationData = await authService.agencyLogin({
            email: payload.data.email,
            password: payload.data.password,
            req
        });


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
        if (!req.user || !req.user.id) {
            throw new AppError(
                401,
                "UNAUTHORIZED",
                "Missing user payload"
            )
        }
        const profile = await authService.getCurrentUser({ userId: req.user.id });

        return successResponse(
            res,
            200,
            "Current user retrieved successfully",
            profile,
        )

    } catch (error) {
        next(error);
    }
};



export const changePassword = async (req, res, next) => {

    try {
        if (!req.user) {
            throw new AppError(
                401,
                "UNAUTHORIZED",
                "Authentication is required."
            );
        }

        const payload = checkPasswordSchema.safeParse(req.body);

        if (!payload.success) {
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
    } catch (error) {
        next(error);
    }

};


//refresh Token
export const refreshToken = async (req, res, next) => {
    try {
        // Prefer HttpOnly Cookie.
        // Fall back to request body for Postman/mobile clients.
        const refreshToken =
            req.cookies?.refreshToken ??
            req.body?.refreshToken;

        // Reject request if no refresh token was supplied.
        if (!refreshToken) {
            throw new AppError(
                400,
                "REFRESH_TOKEN_REQUIRED",
                "Refresh token is required."
            );
        }

        // Verify, rotate and generate a brand new token pair.
        const tokens =
            await authenticationService.refreshTokenRotation(
                refreshToken
            );

        // (Optional)
        // When using cookies, overwrite the previous refresh cookie.
        //
        // Uncomment when frontend moves to HttpOnly Cookies.
        //
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return successResponse(
            res,
            200,
            "Token refreshed successfully.",
            tokens
        );

    } catch (error) {
        next(error);
    }
};



export const logout = async (req, res, next) => {
    try {

        const refreshToken =
            req.cookies?.refreshToken ??
            req.body?.refreshToken;

        if (!refreshToken) {
            throw new AppError(
                400,
                "REFRESH_TOKEN_REQUIRED",
                "Refresh token is required."
            );
        }

        await authenticationService.logout(refreshToken);
        // Uncomment when frontend starts using HttpOnly cookies.
        //
        // res.clearCookie("refreshToken");

        return res.status(200).json({
            success: true,
            message: "Logged out successfully."
        });



    } catch (error) {
        next(error);
    }
};


export const forgetPassword = async (
    req, res, next
) => {
    try {
        const result = forgotPasswordSchema.safeParse(req.body);
        if (!result.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                "Invalid request data.",
                data.error.flatten()
            );
        }
        await passwordResetService.forgetPassword(result.data);

        return successResponse(
            res,
            200,
            "If an account exists, a password reset email has been sent."
        );
    } catch (error) {
        next(error);
    }
};

// Reset Password
export const resetPassword = async (req, res, next) => {
    try {
        const result = resetPasswordSchema.safeParse(req.body);
        if (!result.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                "Invalid request data.",
                data.error.flatten()
            );
        }

        await passwordResetService.resetPassword(result.data);

        return successResponse(
            res,
            200,
            "Password reset successfully."
        );


    } catch (error) {
        next(error)
    }
}