export const extractAccessToken = (req) => {

    // Future frontend (HttpOnly Cookie)
    if (req.cookies?.accessToken) {
        return req.cookies.accessToken;
    }

    // Current implementation (Bearer Token)
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return null;
    }

    if (!authHeader.startsWith("Bearer ")) {
        return null;
    }

    return authHeader.substring(7).trim();
};