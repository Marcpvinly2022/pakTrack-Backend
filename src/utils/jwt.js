import jwt from "jsonwebtoken";

// generate access token
export const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
        }
    );
};

// generate refresh token
export const genearteRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
        }
    );
};


// verify an access token.
export const verifyAccessToken = (token) => {
    if(typeof token !== "string") {
        throw new Error(
            "JWT verify requires a string token."
        );
    }

    return jwt.verify(
        token, 
        process.env.JWT_ACCESS_SECRET
    );
};
// verify an refresh token.
export const verifyRefreshToken = (token) => {
    if(typeof token !== "string") {
        throw new Error(
            "JWT verify requires a string token."
        );
    }

    return jwt.verify(
        token, 
        process.env.JWT_REFRESH_SECRET
    );
};
