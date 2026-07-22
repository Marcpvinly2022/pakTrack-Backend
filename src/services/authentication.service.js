import { generateAccessToken } from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { prisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { ROLES } from "../modules/constants/roles.js";


//buildTokenPayload()

export const buildTokenPayload = ({
    id,
    tenantId,
    role,
    type,

}) => {
    return {
        id,
        tenantId,
        role,
        type,
    };
};

//createAccessToken()
export const createAccessToken = (payload) => {
    return generateAccessToken(payload);
}

//verifyPassword()

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
    };

    if (model === "client") {
        updateData.isActive = true;
        updateData.accountStatus = "ACTIVE";
    }

    await prisma[model].update({
        where: { id },
        data: updateData,
    });

    return {
        success: true,
    };
};



export const authenticateAccount = async ({
    account,
    password,
    accountType,
}) => {

    //verify password 
    await verifyPassword(password, account.passwordHash);

    //generate JWT

    const role =
        accountType === "CLIENT"
            ? ROLES.TRAVELLER
            : account.role;

    const token = createAccessToken(
        buildTokenPayload({
            id: account.id,
            tenantId: account.tenantId,
            role,
            type: accountType,
        })
    );

    // update last login 
    await updateLastLogin(
        accountType === "CLIENT" ? "client" : "user", account.id
    );

    return token;
}