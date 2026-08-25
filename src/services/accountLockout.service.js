import { prisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { MAX_LOGIN_ATTEMPTS, ACCOUNT_LOCK_DURATION } from "../modules/constants/security.js";
import { createAuditLog } from "./auditLog.service.js";

export const ensureAccountNotLocked = async (model, account) => {
    const refreshAccount = await prisma[model].findUnique({
        where: {
            id: account.id,
        },

        select: {
            failedLoginAttempts: true,
            lockedUntil: true,
        }
    });

    if (!refreshAccount) {
        throw new AppError(
            404,
            "ACCOUNT_NOT_FOUND",
            "Account not found."
        );
    }

    if (!refreshAccount.lockedUntil) {
        return;
    }


    if (refreshAccount.lockedUntil <= new Date()) {

        await prisma[model].update({
            where: {
                id: account.id,
            },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });

        return;
    }

    throw new AppError(
        423,
        "ACCOUNT_LOCKED",
        "Your account is temporarily locked. Please try again later."
    );
}



export const recordFailedLoginAttempt = async (
    model,
    account
) => {

    // STEP 1
    const updatedAccount = await prisma[model].update({

        where: {
            id: account.id,
        },

        data: {
            failedLoginAttempts: {
                increment: 1,
            },
            lastFailedLoginAt: new Date(),
        },

        select: {
            failedLoginAttempts: true,
        },

    });

    // STEP 2
    if (
        updatedAccount.failedLoginAttempts <
        MAX_LOGIN_ATTEMPTS
    ) {
        return;
    }

    // STEP 3
    await prisma[model].update({

        where: {
            id: account.id,
        },

        data: {
            lockedUntil: new Date(
                Date.now() + ACCOUNT_LOCK_DURATION
            ),
        },

    });


    await createAuditLog({
        actorId: account.id,
        actorType: model === "client"
            ? "CLIENT"
            : "USER",
        action: "ACCOUNT_LOCKED",
        resource: "AUTH",
        status: "FAILURE",
    });
    // STEP 4
    throw new AppError(
        423,
        "TOO_MANY_FAILED_ATTEMPTS",
        "Too many failed login attempts. Your account has been locked temporarily."
    );

};


export const resetFailedLoginAttempts = async (
    model,
    accountId
) => {

    await prisma[model].update({

        where: {
            id: accountId,
        },

        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
        },

    });

};
