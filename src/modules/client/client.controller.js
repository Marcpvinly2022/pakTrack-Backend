import * as clientService from "./client.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { listClientsQuerySchema,checkPasswordSchema, createClientSchema, loginClientSchema, forgotPasswordSchema, resetPasswordSchema, clientIdParamSchema, createApplicationSchema, reassignClientSchema } from "./client.validator.js";
import { prisma } from "../../config/database.js";
import { queueNotification } from "../notification/notification.service.js"
import { successResponse } from "../../utils/apiResponse.js";
import * as authenticationService from "../../services/authentication.service.js";
import { REFRESH_TOKEN_TTL } from "../constants/auth.js";
import * as passwordRestService from "../../services/passwordReset.service.js";
import { createAuditLog } from "../../services/auditLog.service.js";


export const createClient = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
        }

        const payload = createClientSchema.safeParse(req.body);
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

        const result = await clientService.createClient({
            tenantId: req.user.tenantId,
            actorId: req.user.id,
            actorRole: req.user.role,
            ...payload.data,
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
            userAgent: req.headers["user-agent"] || "unknown",
        });

        // After the tx commits: welcome email carrying the temp password.
        const tenant = await prisma.tenant.findUnique({
            where: { id: req.user.tenantId },
            select: { agencyName: true, subdomain: true },
        });

        try {
            await queueNotification({
                tenantId: req.user.tenantId,
                clientId: result.client.id,
                recipient: result.client.email,
                type: "CLIENT_ACCOUNT_CREATED",
                message:
                    `Welcome ${result.client.firstName} ${result.client.lastName}. ` +
                    `Your temporary password is ${result.temporaryPassword}.`,
                payload: {
                    agencyName: tenant?.agencyName ?? null,
                    clientName: `${result.client.firstName} ${result.client.lastName}`,
                    deskAgent: result.deskAgentName || "Your assigned consultant",
                    email: result.client.email,
                    temporaryPassword: result.temporaryPassword,
                    loginUrl:
                        process.env.CLIENT_PORTAL_URL ||
                        `https://${tenant?.subdomain ?? "app"}.paktrack.com/login`,
                },
            });
        } catch (notifyErr) {
            // Client already exists in the DB — a queue hiccup must not turn this into a 500.
            console.error("CLIENT_WELCOME_NOTIFY_FAILED:", notifyErr.message);
        }

        return successResponse(res, 201, "Client created successfully.", result.client);
    } catch (error) {
        await createAuditLog({
            actorId: account.id,
            actorType: accountType,
            action: "LOGIN",
            resource: "AUTH",
            status: "FAILURE",
            metadata: {
                reason: error.code,
            },
        });
        next(error);
    }
};


export const clientLogin = async(req, res, next) => {
    try{
        const payload = loginClientSchema.safeParse(req.body);
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

        const result = await clientService.clientLogin({
            email: payload.data.email,
            password: payload.data.password,
            req,
        });

        // Mirror the staff/auth cookie behaviour so the refresh flow works the same.
        res.cookie("refreshToken", result.refreshToken,{
            httpOnly: true,
            secure: process.env.NODE_ENV == "production",
            sameSite: "strict",
            maxAge: REFRESH_TOKEN_TTL,
        });

        return successResponse(
            res,
            200,
            "Client Authenticated successFully.",
            result
        );

    }catch(error){
        console.error("🔥 FULL ERROR:", error);
        console.error("🔥 STACK:", error?.stack);
        next(error);
    }
};

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
        console.error("🔥 FULL ERROR:", error);
        console.error("🔥 STACK:", error?.stack);
        next(error)
    }

}

export const createApplication = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "Authentication is required."
      );
    }

    const params = clientIdParamSchema.safeParse(req.params);

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

    const body = createApplicationSchema.safeParse(req.body);

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

    const result = await clientService.createApplication({
      tenantId: req.user.tenantId,
      actorId: req.user.id,
      clientId: params.data.clientId,
      serviceId: body.data.serviceId,
      ipAddress: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "unknown",
    });

    return successResponse(
      res,
      201,
      "Application created successfully.",
      result.application
    );
  } catch (error) {
    console.error("🔥 FULL ERROR:", error);
    console.error("🔥 STACK:", error?.stack);
    next(error);
  }
};




export const getClients = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    const query = listClientsQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        query.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }))
      );
    }

    const result = await clientService.getClients({
      tenantId: req.user.tenantId,
      actorId: req.user.id,
      actorRole: req.user.role,
      ...query.data,   // page, limit, status, search (with defaults applied)
    });

    return successResponse(res, 200, "Clients retrieved successfully.", result);
  } catch (error) {
    console.error("🔥 FULL ERROR:", error);
    console.error("🔥 STACK:", error?.stack);
    next(error);
  }
};





export const getClientById = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    const params = clientIdParamSchema.safeParse(req.params);
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

    const client = await clientService.getClientById({
      tenantId: req.user.tenantId,
      actorId: req.user.id,
      actorRole: req.user.role,
      clientId: params.data.clientId,
    });

    return successResponse(res, 200, "Client retrieved successfully.", client);
  } catch (error) {
    console.error("🔥 FULL ERROR:", error);
    console.error("🔥 STACK:", error?.stack);
    next(error);
  }
};


export const reassignClient = async (req, res, next) => {
    try{
        if(!req.user) throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");

        // clientId comes from the URL (:clientId); newDeskAgentId/reason/notes from the body.
        const params = clientIdParamSchema.safeParse(req.params);
        if(!params.success){
            throw new AppError(400, "VALIDATION_ERROR", params.error.issues.map((i) => ({field: i.path.join("."), message: i.message})) );
        }

        const body = reassignClientSchema.safeParse(req.body);
        if(!body.success){
            throw new AppError(400, "VALIDATION_ERROR", body.error.issues.map((i) => ({field: i.path.join("."), message: i.message})) );
        }

        const result = await clientService.reassignClient({
            tenantId: req.user.tenantId,
            actorId: req.user.id,
            clientId: params.data.clientId,
            ...body.data,   // newDeskAgentId, reason, notes
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
            userAgent: req.headers["user-agent"] || "unknown",
        });

        // After the tx commits: tell the client who their new consultant is.
        const tenant = await prisma.tenant.findUnique({
            where: { id: req.user.tenantId },
            select: { agencyName: true, subdomain: true },
        });

        try {
            await queueNotification({
                tenantId: req.user.tenantId,
                clientId: result.client.id,
                recipient: result.client.email,
                type: "CLIENT_REASSIGNED",
                message: `Your consultant is now ${result.newDeskAgentName}.`,
                payload: {
                    email: result.client.email,   // ← the worker sends to payload.email
                    agencyName: tenant?.agencyName ?? null,
                    clientName: `${result.client.firstName} ${result.client.lastName}`,
                    deskAgent: result.newDeskAgentName,
                    loginUrl:
                        process.env.CLIENT_PORTAL_URL ||
                        `https://${tenant?.subdomain ?? "app"}.paktrack.com/login`,
                },
            });
        } catch (notifyErr) {
            // Reassignment already committed — a queue hiccup must not turn this into a 500.
            console.error("CLIENT_REASSIGN_NOTIFY_FAILED:", notifyErr.message);
        }

        return successResponse(res, 200, "Client reassigned Successfully.", result);
    }catch(error){
        console.error("🔥 FULL ERROR:", error);
        console.error("🔥 STACK:", error?.stack);

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












// export const createClient = async (req, res, next) => {
//     try {
//         const payload = createClientSchema.safeParse(req.body)
//         if (!payload.success) {
//             throw new AppError(
//                 400,
//                 "VALIDATION_ERROR",
//                 payload.error.issues.map(issue => ({
//                     field: issue.path.join("."),
//                     message: issue.message,
//                 }))
//             );

//         }

//         if (!req.user) {
//             throw new AppError(
//                 401,
//                 "UNAUTHENTICATED",
//                 "Authentication required."
//             );
//         }

//         const result = await clientService.createClient(payload.data, req.user);
//         //load the tenant
//         const tenant = await prisma.tenant.findUnique({
//             where: {
//                 id: req.user.tenantId,
//             },
//         });
//         //load the desk agent
//         const deskAgent = await prisma.user.findUnique({
//             where: {
//                 id: req.user.id
//             },
//         });

//         await queueNotification({
//             tenantId: req.user.tenantId,
//             clientId: result.client.id,
//             recipient: result.client.email,
//             subject: "Welcome to PakTrack",
//             type: "CLIENT_ACCOUNT_CREATED",
//             message:
//                 `Welcome ${result.client.firstName}. ` +
//                 `Your temporary password is ${result.temporaryPassword}.`,

//             payload: {
//                 agencyName: tenant.agencyName,
//                 clientName: `${result.client.firstName} ${result.client.lastName}`,
//                 deskAgent: `${deskAgent.firstName} ${deskAgent.lastName}`,
//                 serviceName: result.serviceName,
//                 email: result.client.email,
//                 temporaryPassword: result.temporaryPassword,
//             }
//         })

//         return successResponse(
//             res,
//             201,
//             "Client Created Successfully.",
//             result.client
//         );


//     } catch (error) {
//         await createAuditLog({
//             actorId: account.id,
//             actorType: accountType,
//             action: "LOGIN",
//             resource: "AUTH",
//             status: "FAILURE",
//             metadata: {
//                 reason: error.code,
//             },
//         });
//         next(error);
//     }
// };

// export const clientLogin = async (req, res, next) => {
//     try {
//         const payload = loginClientSchema.safeParse(req.body);
//         if (!payload.success) {
//             throw new AppError(
//                 401,
//                 "VALIDATION_ERROR",
//                 payload.error.issues.map((issue) => ({
//                     field: issue.path.join("."),
//                     message: issue.message
//                 }))
//             )
//         }


//         const clientData = await clientService.clientLogin({
//             email: payload.data.email,
//             password: payload.data.password,
//             req
//         });
//         const { refreshToken, accessToken, profile } = clientData;

//         res.cookie("refreshToken", refreshToken, {
//             httpOnly: true,                 // Shields token from XSS attacks
//             secure: process.env.NODE_ENV === "production", // True forces HTTPS, false for local HTTP testing
//             sameSite: "strict",             // Hardens cookie against CSRF vectors
//             maxAge: REFRESH_TOKEN_TTL, // Syncs cookie life with your 7-day Redis session window
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Client login successsfully",
//             data: clientData,
//         })

//     } catch (error) {
//         next(error)
//     }
// }
