import * as clientService from "./client.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { checkPasswordSchema, createClientSchema, loginClientSchema, forgotPasswordSchema, resetPasswordSchema } from "./client.validator.js";
import { prisma } from "../../config/database.js";
import { queueNotification } from "../notification/notification.service.js"
import { successResponse } from "../../utils/apiResponse.js";

import * as authenticationService from "../../services/authentication.service.js";
import { REFRESH_TOKEN_TTL } from "../constants/auth.js";
import * as passwordRestService from "../../services/passwordReset.service.js";

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

export const clientLogin = async (req, res, next) => {
    try {
        const payload = loginClientSchema.safeParse(req.body);
        if (!payload.success) {
            throw new AppError(
                401,
                "VALIDATION_ERROR",
                payload.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            )
        }


        const clientData = await clientService.clientLogin(payload.data);
        const { refreshToken, accessToken, profile } = clientData;

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,                 // Shields token from XSS attacks
            secure: process.env.NODE_ENV === "production", // True forces HTTPS, false for local HTTP testing
            sameSite: "strict",             // Hardens cookie against CSRF vectors
            maxAge: REFRESH_TOKEN_TTL, // Syncs cookie life with your 7-day Redis session window
        });

        return res.status(200).json({
            success: true,
            message: "Client login successsfully",
            data: clientData,
        })

    } catch (error) {
        next(error)
    }
}


export const changePassword = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new AppError(

            )
        }

        const payload = checkPasswordSchema.safeParse(req.body);

        if (!payload.success) {
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

    } catch (error) {
        next(error)
    }

}





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


export const forgetPassword = async (req, res, next) => {
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
        await passwordRestService.forgetPassword(result.data);

        return successResponse(
            res,
            200,
            "If an account exists, a password reset email has been sent."
        )
    } catch (error) {
        next(error)
    }
}

export const resetPassword = async (req, res, next) => {
    try {
        const result = resetPasswordSchema.safeParse(req.body);
        if (!result.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                "Invalid request data.",
                result.error.flatten()
            );
        }
        await passwordRestService.resetPassword(result.data);

        return successResponse(
            res,
            200,
            "Password reset successfully.",
        )
    } catch (error) {
        next(error)
    }
}