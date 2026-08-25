import * as staffService from "./staff.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { deactivateDeskAgentSchema,createStaffSchema, updateStaffSchema, staffIdParamSchema, checkPasswordSchema, loginStaffSchema, forgotPasswordSchema, resetPasswordSchema } from "./staff.validator.js";
import { prisma } from "../../config/database.js";
import { queueNotification } from "../notification/notification.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as authenticationService from "../../services/authentication.service.js";
import { REFRESH_TOKEN_TTL } from "../constants/auth.js";
import * as passwordRestService from "../../services/passwordReset.service.js";
import { createAuditLog } from "../../services/auditLog.service.js";
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
                id: req.user.tenantId,
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
        console.error(" FULL ", error);
        console.error(" STACK: ", error?.stack);
        next(error)
    }
}


export const staffLogin = async (req, res, next) => {
    try {


        const payload = loginStaffSchema.safeParse(req.body)

        if (!payload.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                payload.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            )
        }


        const staffData = await staffService.staffLogin({
            email: payload.data.email,
            password: payload.data.password,
            req 
        })

        return successResponse(
            res,
            200,
            "Staff authenticated successfully.",
            staffData,
        )

    } catch (error) {
        
         await createAuditLog({
            actorId: null, // Login failed, so there is no verified actor session ID yet
            actorType: "USER",
            action: "LOGIN",
            resource: "AUTH",
            resourceId: req.body?.email || "unknown", // Track their input email safely
            status: "FAILURE",
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
            userAgent: req.headers["user-agent"] || "unknown",
            metadata: {
                reason: error.code || "INVALID_CREDENTIALS",
                message: error.message
            },
        });

        // Pass the clean, controlled error (401 or 403) down to your global error middleware
        return next(error);
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
            "Staff retrieved successfully.",
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
            "Staff member status updated successfully.",
            updatedStaff,

        )

    } catch (error) {
        next(error);
    }
};


export const changePassword = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new AppError(
                401,
                "UNAUTHORIZED",
                "Authentication is required."

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
        next(error)
    }
}


//refresh token

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
        const data = forgotPasswordSchema.safeParse(req.body);
        if (!data.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                "Invalid request data.",
                data.error.flatten()
            );
        }
        await passwordRestService.forgetPassword(data);

        return successResponse(
            res,
            200,
            "If an account exists, a password reset email has been sent.",
        )
    } catch (error) {
        next(error)
    }
}


export const resetPassword = async (req, res, next) => {
    try {
        const data = resetPasswordSchema.safeParse(req.body);
        if (!data.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                "Invalid request data.",
                data.error.flatten()
            );
        }
        await passwordRestService.resetPassword(data);

        return successResponse(
            res,
            200,
            "Password reset successfully.",
        )
    } catch (error) {
        next(error)
    }
}




export const deactivateDeskAgent = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");

    const params = staffIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError(400, "VALIDATION_ERROR",
        params.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })));
    }

    const body = deactivateDeskAgentSchema.safeParse(req.body);
    if (!body.success) {
      throw new AppError(400, "VALIDATION_ERROR",
        body.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })));
    }

    const result = await staffService.deactivateDeskAgent({
      tenantId: req.user.tenantId,
      actorId: req.user.id,
      deskAgentId: params.data.id,
      ...body.data,   // reassignToDeskAgentId, notes
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "unknown",
    });

    return successResponse(res, 200, "Desk agent deactivated and clients reassigned.", result);
  } catch (error) {
    console.error(" 🔥 FULL ERROR:", error);
    console.error(" 🔥 STACK", error?.stack);
    next(error);
  }
};
