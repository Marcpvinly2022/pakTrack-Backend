import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { prisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { ROLES } from "../modules/constants/roles.js";
import { verifyRefreshToken } from "../utils/jwt.js";
import { revokeRefreshToken, verifyRefreshSession, storeRefreshToken, rotateRefreshToken, consumeRefreshSession, attachRotatedSession } from "./refreshToken.service.js";
import { REFRESH_TOKEN_TTL, REFRESH_REUSE_GRACE_MS } from "../modules/constants/auth.js";
import { ensureAccountNotLocked, recordFailedLoginAttempt, resetFailedLoginAttempts } from "./accountLockout.service.js";
import { revokeAllSessions } from "./session.service.js";
import { queueNotification } from "../modules/notification/notification.service.js";
import { logger } from "../utils/logger.js";
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
        sessionVersion: { increment: 1},
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

    return {
        success: true,
    };
};


//account authentication Helper
export const authenticateAccount = async ({
    account,
    password,
    accountType,
}) => {
    const model = accountType === "CLIENT" ? "client" : "user";

    // 1. Assert account is currently unfrozen
    await ensureAccountNotLocked(model, account);

    // 2. Validate Password Integrity
    try {
        await verifyPassword(password, account.passwordHash);
    } catch (error) {
        // Record the failure to DB first
        await recordFailedLoginAttempt(model, account);

        // If password was wrong, recordfailedLoginAttempt executes, increments, 
        // and if it hits 5, it throws an AppError. If it doesn't throw, we fall through
        // and throw the generic invalid credentials block below.
        throw error;
    }

    // 3. Complete successful login session setup
    await resetFailedLoginAttempts(model, account.id);

    const tokens = createTokenPair(account, accountType);

    await storeRefreshToken({
        jti: tokens.jti,
        userId: account.id,
        type: accountType,
        ttl: REFRESH_TOKEN_TTL,
    });
    console.log("Stored Refresh JTI:", tokens.jti);

    await updateLastLogin(model, account.id);
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
const handleTokenReuse = async ({ model, userId }) => {

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
            await handleTokenReuse({ model, userId: payload.sub });

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


        // Never expose the internal JTI to clients.
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };

    } catch (error) {

        console.error(error);
        throw error;
    }
};