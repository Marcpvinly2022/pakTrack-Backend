import { prisma } from "../config/database.js";
import { verifyAccessToken, verifyRefreshToken } from "../utils/jwt.js";
import { extractAccessToken } from "../utils/tokenHelper.js";
import { AppError } from "./errorHandler.js";

export const authenticate = async (req, res, next) => {
    try {

        // Extract access token from Cookie or Authorization header.
        const token = extractAccessToken(req);

        if (!token) {
            throw new AppError(
                401,
                "UNAUTHORIZED",
                "Access token is required."
            );
        }

        // Verify JWT signature, issuer and audience.
        const payload = verifyAccessToken(token);


        // Determine which Prisma model to query.
        const model =
            payload.type === "CLIENT"
                ? "client"
                : "user";

        // Always load the latest account from the database.
        const account = await prisma[model].findUnique({
            where: {
                id: payload.sub,
            },
        });

        // Reject deleted or missing accounts.
        if (!account || account.deletedAt) {
            throw new AppError(
                401,
                "ACCOUNT_NOT_FOUND",
                "Account no longer exists."
            );
        }
        const pathToCheck = req.originalUrl || req.path || "";
        const isChangingPassword = /change-password/i.test(pathToCheck);

        // 🔍 DEBUG TRACE TELEMETRY (Look at your terminal console when you hit send!)
        console.log(`📡 [PakTrack Middleware Debug]: Incoming URL -> ${pathToCheck}`);
        console.log(`🛡️ [PakTrack Middleware Debug]: Is Password Change Detected? -> ${isChangingPassword}`);
        // Reject disabled accounts.
        if (!account.isActive && !isChangingPassword) {
            throw new AppError(
                403,
                "ACCOUNT_DISABLED",
                "Account has been disabled."
            );
        }

        if (payload.sessionVersion !== account.sessionVersion) {
            throw new AppError(
                401,
                "SESSION_REVOKED",
                "Your session has expired. Please sign in again."
            );
        }

        
        // Extra validation for clients.
        if (
            model === "client" &&
            account.accountStatus !== "ACTIVE" &&
            !isChangingPassword
        ) {
            throw new AppError(
                403,
                "ACCOUNT_DISABLED",
                "Client account is inactive."
            );
        }

        // Attach the latest account to the request.
        req.user = {
            ...account,
            type: payload.type,
        };

        return next();

    } catch (error) {
        return next(error);
    }
};


export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new AppError(
                    500,
                    "AUTHENTICATION_MISSING",
                    "Authorization middleware must be executed after the authentication layer."
                );
            }

            // Clients should never pass role-based authorization.
            if (req.user.type === "CLIENT") {
                throw new AppError(
                    403,
                    "FORBIDDEN_RESOURCE",
                    "Clients cannot access this resource."
                );
            }

            const hasPermission = allowedRoles.includes(req.user.role);

            if (!hasPermission) {
                throw new AppError(
                    403, // 403 Forbidden means we know who you are, but you do not have permission
                    "FORBIDDEN_RESOURCE",
                    "You do not have the required permissions to perform this action."
                );
            }

            return next();
        } catch (error) {
            return next(error);
        };
    };
}

export const preVerifyRefreshToken = (req, res, next) => {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
    if (!token) {
        return next();
    }

    try {
        req.verifyRefreshTokenPayload = verifyRefreshToken(token);
    } catch {
        req.verifyRefreshTokenInvalid = true;
    }

    return next();
}