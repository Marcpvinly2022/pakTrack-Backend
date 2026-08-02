import crypto from "crypto";
import { prisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { PASSWORD_RESET_TOKEN_TTL } from "../modules/constants/security.js";
import { notificationQueue } from "../jobs/notification.queue.js";
import { hashPassword } from "../utils/password.js";
import { revokeAllSessions } from "./session.service.js";
export const generatePasswordResetToken = () => {
    const token = crypto.randomBytes(32).toString("hex");

    const tokenHash =
        crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

    return {
        token,
        tokenHash,
    };
};


export const storePasswordRestToken = async ({
    accoundId,
    accountType,
    tokenHash,
}) => {

    const model = accountType === "CLIENT"
        ? "client"
        : "user";

    const expiresAt = new Date(
        Date.now() + PASSWORD_RESET_TOKEN_TTL // 15 minutes
    );

    await prisma[model].update({
        where: {
            id: accoundId,
        },

        data: {
            passwordResetTokenHash: tokenHash,
            passwordResetExpiresAt: expiresAt,
            passwordResetRequestedAt: new Date(),
            passwordResetUsedAt: null,
        },
    });

};


export const forgetPassword = async ({
    email,
    accountType,
}) => {
    // Determine which account model to search.
    const model = accountType === "CLIENT"
        ? "client"
        : "user";

    const normalizedEmail = String(email).trim().toLowerCase();

    //Look up the account by email.
    const account = await prisma[model].findFirst({
        where: {
            email: normalizedEmail,
        },

    });


    // Prevent email enumeration.
    if (!account) {
        return {
            success: true,
        };
    }

    //Generate a secure reset token.
    const { token, tokenHash } = generatePasswordResetToken();

    //Store the hashed token.
    await storePasswordRestToken({
        accoundId: account.id,
        accountType,
        tokenHash,
    });

    const notification = await prisma.notification.create({
        data: {
            tenantId: account.tenantId,
            clientId: accountType === "CLIENT" ? account.id : null,
            userId: accountType === "USER" ? account.id : null,
            recipient: account.email,
            channel: "EMAIL",
            type: "PASSWORD_RESET",
            subject: "Reset your password",
            message: "Password reset requested.",
            status: "PENDING",
        },
    });

    // Queue the job
    await notificationQueue.add(
        "password-reset",

        {
            notificationId: notification.id,

            type: "PASSWORD_RESET",

            payload: {
                email: account.email,

                firstName: account.firstName,

                resetLink:
                    `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
            },
        }
    );

    return {
        success: true,

    }

}



export const resetPassword = async ({
    token,
    password,
    accountType,
}) => {

    // Hash incoming token.
    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    // Determine model.
    const model = accountType === "CLIENT"
        ? "client"
        : "user";


    // Find matching account.
    const account = await prisma[model].findFirst({
        where: {
            passwordResetTokenHash: tokenHash,
        },
    });

    if (!account) {
        throw new AppError(
            400,

            "INVALID_RESET_TOKEN",

            "Reset token is invalid."
        )
    }

    // Verify expiry.
    if (
        !account.passwordResetExpiresAt || account.passwordResetExpiresAt < new Date()
    ) {

        throw new AppError(

            400,

            "RESET_TOKEN_EXPIRED",

            "Reset token has expired."

        );

    }

    // Hash new password.
    const passwordHash = await hashPassword(password);

    // Update account.
    await prisma[model].update({
        where: {
            id: account.id,
        },

        data: {
            passwordHash,
            passwordResetTokenHash: null,
            passwordResetExpiresAt: null,
            passwordResetRequestedAt: null,
            passwordResetUsedAt: new Date(),
            failedLoginAttempts: 0,
            lockedUntil: null,
            sessionVersion: {
                increment: 1,
            }
        }
    });
    await revokeAllSessions(account.id);
    return {
        success: true,
    };

};
