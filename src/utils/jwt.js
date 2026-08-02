import jwt from "jsonwebtoken";
import { AppError } from "../middlewares/errorHandler.js";

const SETTINGS = Object.freeze({
    issuer: "PakTrack",
    audience: "PakTrackAPI"
});
// Access Token
export const generateAccessToken = ({
    sub,
    tenantId,
    role,
    type,
    sessionVersion,
}) => {
    return jwt.sign(
        {
            sub,
            tenantId,
            role,
            type,
            sessionVersion,
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
            issuer: SETTINGS.issuer,
            audience: SETTINGS.audience
        }
    );
};

// Refresh Token
export const generateRefreshToken = ({
    sub,
    type,
    jti,
}) => {
    return jwt.sign(
        {
            sub,
            type,
            jti,
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
            issuer: SETTINGS.issuer,
            audience: SETTINGS.audience
        }
    );
};

// Verify Access Token
export const verifyAccessToken = (token) => {
    if (typeof token !== "string" || token.trim() === "") {
        throw new TypeError("JWT verification requires a valid string token.");
    }
    try {
        return jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET, {
            issuer: SETTINGS.issuer,
            audience: SETTINGS.audience
        }
        );
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new AppError(
                401,
                "ACCESS_TOKEN_EXPIRED",
                "Your access token has expired. Please refresh your session."
            );
        }

        // ✅ Catch any signature alterations or malformed tokens safely
        throw new AppError(
            401,
            "INVALID_ACCESS_TOKEN",
            "The provided access token is malformed, invalid, or tampered with."
        );
    }
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
    if (typeof token !== "string" || token.trim() === "") {
        throw new TypeError("JWT verification requires a valid string token.");
    }
    try {
        return jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET, {
            issuer: SETTINGS.issuer,
            audience: SETTINGS.audience
        }
        );
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new AppError(
                401,
                "REFRESH_TOKEN_EXPIRED",
                "Your session has expired. Please log in again."
            );
        }

        throw new AppError(
            401,
            "INVALID_REFRESH_TOKEN",
            "The refresh token is invalid or tampered with."
        );
    }
};