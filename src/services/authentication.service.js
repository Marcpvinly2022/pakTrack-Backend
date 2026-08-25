import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { prisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { ROLES } from "../modules/constants/roles.js";
import { verifyRefreshToken } from "../utils/jwt.js";
import { storeRefreshToken, verifyRefreshSession, revokeRefreshToken, consumeRefreshSession, attachRotatedSession } from "./refreshToken.service.js";
import { REFRESH_TOKEN_TTL, REFRESH_REUSE_GRACE_MS } from "../modules/constants/auth.js";
import { ensureAccountNotLocked, recordFailedLoginAttempt, resetFailedLoginAttempts } from "./accountLockout.service.js";
import { revokeAllSessions } from "./session.service.js";
import { queueNotification } from "../modules/notification/notification.service.js";
import { logger } from "../utils/logger.js";
import { createAuditLog } from "./auditLog.service.js";
//
export const createTokenPair = (account, accountType) => {

    const jti = crypto.randomUUID();

    const accessToken = generateAccessToken({
        sub: account.id,
        tenantId: account.tenantId,
        role: account.role ?? ROLES.TRAVELLER,
        type: accountType,
        sessionVersion: account.sessionVersion,
    });

    const refreshToken = generateRefreshToken({
        sub: account.id,
        type: accountType,
        jti,
    });

    return {
        accessToken,
        refreshToken,
        jti,
    };
};


export const verifyPassword = async (
    plainPassword,
    passwordHash
) => {
    // console.log("🔍 DEBUG - Incoming plain password from request:", plainPassword);
    // console.log("🔍 DEBUG - Encrypted hash fetched from database:", passwordHash);
    const valid = await comparePassword(plainPassword, passwordHash);

    // console.log("Password Match:", valid);
    if (!valid) {
        throw new AppError(
            401,
            "INVALID_CREDENTIALS",
            "Invalid email or password."
        );


    }
    return true;

};
//updateLastLogin()
export const updateLastLogin = async (
    model,
    id
) => {
    await prisma[model].update({
        where: {
            id,
        },

        data: {
            lastLoginAt: new Date(),
        },
    });
};


//change password helper
export const changePassword = async ({
    model,
    id,
    currentPassword,
    newPassword,
}) => {

    const account = await prisma[model].findUnique({
        where: { id },
    });

    if (!account) {
        throw new AppError(
            404,
            "ACCOUNT_NOT_FOUND",
            "Account not found."
        );
    }

    await verifyPassword(
        currentPassword,
        account.passwordHash
    );

    const isSamePassword = await comparePassword(
        newPassword,
        account.passwordHash
    );

    if (isSamePassword) {
        throw new AppError(
            400,
            "PASSWORD_REUSE",
            "New password must be different from the current password."
        );
    }

    const passwordHash = await hashPassword(newPassword);

    const updateData = {
        passwordHash,
        mustChangePassword: false,
        sessionVersion: { increment: 1 },
    };

    if (model === "client") {
        updateData.isActive = true;
        updateData.accountStatus = "ACTIVE";
    }

    await prisma[model].update({
        where: { id },
        data: updateData,
    });
    await revokeAllSessions(account.id);
    await createAuditLog({
        actorId: account.id,
        actorType: model === "client"
            ? "CLIENT"
            : "USER",
        action: "PASSWORD_CHANGE",
        resource: "AUTH",
        status: "SUCCESS",
        metadata: {
            sessionRevoked: true
        }
    });

    return {
        success: true,
    };
};


//account authentication Helper
// ✅ FIXED: Added 'req' parameter to the function signature destructured object
export const authenticateAccount = async ({
    account,
    password,
    portal,
    req // 🛡️ Hands network request telemetry down to your inner methods safely
}) => {
    const model = portal === "CLIENT" ? "client" : "user";

    const ALLOWED_GATEWAY_ROLES = {
        ADMIN: [ROLES.PLATFORM_GLOBAL_ADMIN, ROLES.AGENCY_ADMIN],
        STAFF: [ROLES.DESK_AGENT],
        CLIENT: [ROLES.TRAVELLER, "CLIENT"],
    };

    const currentRole = account.role || "CLIENT";
    const allowedRoles = ALLOWED_GATEWAY_ROLES[portal?.toUpperCase()];

    if (!allowedRoles || !allowedRoles.includes(currentRole)) {
        throw new AppError(
             403,
            "UNAUTHORIZED_GATEWAY",
            "Access Denied: Your account role is not permitted to log in through this portal."
        );
    }

    // ==========================================
    // REST OF YOUR PERFECT AUTHENTICATION LOGIC
    // ==========================================
    await ensureAccountNotLocked(model, account);

    try {
        await verifyPassword(password, account.passwordHash);
    } catch (error) {
        await recordFailedLoginAttempt(model, account);
        
        // Pass req data context down to your fixed audit log handlers
        await createAuditLog({
            actorId: account.id,
            actorType: portal,
            action: "LOGIN",
            resource: "AUTH",
            status: "FAILURE",
            ipAddress: req?.ip || "127.0.0.1",
            userAgent: req?.headers["user-agent"] || "unknown",
            metadata: { reason: error.code },
        });

        throw error;
    }

    await resetFailedLoginAttempts(model, account.id);
    const tokens = createTokenPair(account, portal);

    // Pass the req variable forward if your storage function extracts device metrics
    await storeRefreshToken({
        jti: tokens.jti,
        userId: account.id,
        type: portal,
        ttl: REFRESH_TOKEN_TTL,
        req // Pass it down if needed
    });

    await updateLastLogin(model, account.id);

    await createAuditLog({
        actorId: account.id,
        actorType: portal,
        action: "LOGIN",
        resource: "AUTH",
        status: "SUCCESS",
        ipAddress: req?.ip || "127.0.0.1",
        userAgent: req?.headers["user-agent"] || "unknown",
        metadata: {
            role: account.role,
            tenantId: account.tenantId,
        },
    });

    return tokens;
};



export const logout = async (refreshToken) => {

    // Verify refresh token
    try {
        // Line 218: This calls your utility function
        const payload = verifyRefreshToken(refreshToken);


        const session = await verifyRefreshSession(payload.jti);

        if (!session) {
            throw new AppError(
                401,
                "INVALID_REFRESH_TOKEN",
                "Refresh token has expired or has been revoked."
            );
        }

        // Remove refresh session from Redis

        await revokeRefreshToken(payload.jti);

        await createAuditLog({
            actorId: session.userId,
            actorType: session.type,
            action: "LOGOUT",
            resource: "AUTH",
            status: "SUCCESS",
            metadata: {
                jti: payload.jti,
            }
        });

        // Return success

        return {
            success: true,
        };


    } catch (error) {
        // ✅ Intercept the crash and turn it into a controlled error
        throw new AppError(
            401,
            "INVALID_REFRESH_TOKEN",
            "The refresh token is invalid, expired, or malformed."
        );
    }
};



// handleTokenReuse()
//
// A rotated refresh token was replayed outside the concurrent-refresh grace
// window -> treat it as a stolen-token replay. Bump sessionVersion so every
// outstanding access token is rejected by the auth middleware, wipe all refresh
// sessions from Redis, and alert the account owner. Mirrors the hard-revocation
// combo already used by changePassword().
const handleTokenReuse = async ({ model, userId, payload }) => {

    let account = null;

    try {
        account = await prisma[model].update({
            where: { id: userId },
            data: { sessionVersion: { increment: 1 } },
        });
    } catch (error) {
        // Account may have been deleted since the token was issued; still make
        // sure any lingering Redis sessions are cleared below.
        logger.warn(
            `Token reuse: failed to bump sessionVersion for ${model} ${userId}: ${error.message}`
        );
    }

    await revokeAllSessions(userId);

    await createAuditLog({
        actorId: payload.sub,
        actorType: payload.type,
        action: "TOKEN_REUSE",
        resource: "AUTH",
        status: "FAILURE",
        metadata: {
            jti: payload.jti,
        },
    });

    // Notify the owner. Never let a notification failure block revocation.
    try {
        if (account && account.tenantId) {
            await queueNotification({
                tenantId: account.tenantId,
                userId: model === "user" ? account.id : null,
                clientId: model === "client" ? account.id : null,
                recipient: account.email,
                type: "SECURITY_ALERT",
                message:
                    "We detected suspicious activity on your account and signed you out of all sessions for your protection. If this was not you, please reset your password immediately.",
                payload: {
                    email: account.email,
                    firstName: account.firstName ?? null,
                    reason: "REFRESH_TOKEN_REUSE",
                },
            });
        } else {
            logger.warn(
                `Token reuse detected for ${model} ${userId} but no tenant/email available; alert skipped.`
            );
        }
    } catch (error) {
        logger.error(
            `Token reuse: failed to queue security alert for ${model} ${userId}: ${error.message}`
        );
    }
};


export const refreshTokenRotation = async (refreshToken, next) => {
    try {
        // Verify JWT signature and decode payload.
        const payload = verifyRefreshToken(refreshToken);

        const model =
            payload.type === "CLIENT"
                ? "client"
                : "user";

        // Atomically spend the refresh token. This both deletes the active
        // session and detects replays of an already-rotated token.
        const now = Date.now();
        const result = await consumeRefreshSession(payload.jti, now);

        if (result.status === "REUSED") {
            const age = now - result.tombstoneAt;

            // Two legit refreshes racing: only one wins the new token pair, the
            // loser gets a retryable 409 instead of being logged out.
            if (age <= REFRESH_REUSE_GRACE_MS) {
                throw new AppError(
                    409,
                    "REFRESH_IN_PROGRESS",
                    "A token refresh is already in progress. Please retry."
                );
            }

            // Genuine replay of a consumed token -> revoke everything.
            await handleTokenReuse({ model, userId: payload.sub, payload });

            throw new AppError(
                401,
                "TOKEN_REUSE_DETECTED",
                "Suspicious activity detected. All sessions have been revoked. Please log in again."
            );
        }

        if (result.status === "MISSING") {
            throw new AppError(
                401,
                "INVALID_REFRESH_TOKEN",
                "Refresh token has expired or has been revoked."
            );
        }

        const session = result.session;

        // Load the latest account from the database.
        // Never trust information stored inside Redis.
        const account = await prisma[model].findUnique({
            where: {
                id: session.userId,
            },
        });

        if (!account) {
            throw new AppError(
                404,
                "ACCOUNT_NOT_FOUND",
                "Account no longer exists."
            );
        }

        // Validate current account state.
        // This ensures disabled users cannot continue refreshing tokens.
        if (model === "client") {

            if (
                !account.isActive ||
                account.accountStatus !== "ACTIVE"
            ) {
                throw new AppError(
                    403,
                    "ACCOUNT_DISABLED",
                    "Client account is inactive."
                );
            }

        } else {

            if (!account.isActive) {
                throw new AppError(
                    403,
                    "ACCOUNT_DISABLED",
                    "Account has been disabled."
                );
            }

        }


        // Generate a completely new Access Token and Refresh Token.
        // A new JTI is generated automatically inside createTokenPair().
        const tokens = createTokenPair(
            account,
            session.type
        );

        // Register the NEW refresh session in Redis (old one is already gone).
        await attachRotatedSession({
            oldJti: payload.jti,
            newJti: tokens.jti,
            userId: account.id,
            type: session.type,
            ttl: REFRESH_TOKEN_TTL,
        });

        await createAuditLog({
            actorId: account.id,
            actorType: session.type,
            action: "TOKEN_REFRESH",
            resource: "AUTH",
            status: "SUCCESS",
            metadata: {
                oldJti: payload.jti,
                newJti: tokens.jti,
                tenantId: account.tenantId
            }
        });

        // Never expose the internal JTI to clients.
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };


    } catch (error) {


        logger.error(
            "AUTH_REFRESH_FAILED",
            {
                err: error,
            }
        );
        throw error;
    }
};