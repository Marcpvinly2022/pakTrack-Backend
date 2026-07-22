import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "./errorHandler.js";

export const authenticate = async (req, res, next ) => {
    try{
        //Read Authorization header
        const authHeader = req.headers.authorization;
        // Header must exit
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            throw new AppError(
                401,
                "UNAUTHORIZED",
                "Authorization header is required."
            );
        }

        // Must use Bearer scheme
        const token = authHeader.substring(7);

        const payload = verifyAccessToken(token);

        if(!payload){
            throw new AppError(
               401,
               "INVALID_TOKEN",
               "The provided token is invalid, expired, or malformed." 
            )
        }

        req.user = payload
        return next();

        }catch(error){
            return next(error)
        }
};


export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try{
            if(!req.user){
                throw new AppError(
                    500,
                    "AUTHENTICATION_MISSING",
                    "Authorization middleware must be executed after the authentication layer."
                );
            }

            const hashPermission = allowedRoles.includes(req.user.role);

            if(!hashPermission){
                throw new AppError(
                    403, // 403 Forbidden means we know who you are, but you do not have permission
                    "FORBIDDEN_RESOURCE",
                    "You do not have the required permissions to perform this action."
                );
            }

            return next();
        }catch(error){
            return next(error);
        };
    };
}