import { ipKeyGenerator } from "express-rate-limit";

/**
 * Global App Key Generator (As implemented by you)
 */
export const rateLimitKeyGenerator = (req) => {
    if (req.user?.sub) {
        return `user:${req.user.sub}`;
    }
    return `ip:${ipKeyGenerator(req)}`;
};

/**
 * ✅ NEW: Dedicated Login Key Generator
 * Pairs the client IP with their normalized email address.
 * 
 * Resulting Redis Key: auth:limiter:login:ip_127.0.0.1:email_user_at_domain_com
 */
export const loginKeyGenerator = (req) => {
    const clientIp = ipKeyGenerator(req);
    
    // Safely extract and normalize the email input from the request body
    const rawEmail = req.body?.email ?? "";
    const normalizedEmail = String(rawEmail).trim().toLowerCase();

    // Fallback gracefully to just the IP if no email is supplied in the request body
    if (!normalizedEmail) {
        return `login:ip:${clientIp}:anon`;
    }

    // Replace special characters that might conflict with standard Redis routing schemes
    const safeEmail = normalizedEmail.replace(/[^a-zA-Z0-9]/g, "_");

    return `login:ip:${clientIp}:email:${safeEmail}`;
};


export const refreshKeyGenerator = (req) => {
    const clientIp = ipKeyGenerator(req);
    if(req.RefreshTokenInvalid){
        return `refresh:ip:${clientIp}:invalid`;
    }

    if(req.RefreshTokenPayload?.jti){
        return `refresh:jti: ${req.RefreshTokenPayload?.jti}`;
    }

    return `refresh:ip:${clientIp}:anonymous`;
}

export const resetPasswordKeyGenerator = (req) => {

    const ip = ipKeyGenerator(req);

    const token =
        req.body?.token ?? "";

    const snippet = token
        ? token.slice(-12).replace(/[^a-zA-Z0-9]/g, "_")
        : "missing";

    return `reset:${ip}:${snippet}`;
};