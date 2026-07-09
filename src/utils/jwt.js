import jwt from "jsonwebtoken";

export const generateAccessToken = (payload, secret) => {
    return jwt.sign(payload, secret, {
        expiresIn: "12h",
    })
}

export const verifyAccessToken = (token, secret) => {
    if (typeof token !== "string") {
        throw new Error("JWT verify requires a raw string token parameter.");
    }
    return jwt.verify(token, secret);
};


