import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

export class AppError extends Error {
    // Fixed: Ensured 'customErrors' is initialized safely as a constructor parameter
    constructor(statusCode, code, message, customErrors = null) { 
        const displayMessage = Array.isArray(message) ? "Validation failed." : message;
        super(displayMessage);

        this.statusCode = statusCode;
        this.code = code;
        // Secure assignment checking if message array was passed directly as the container
        this.errors = Array.isArray(message) ? message : customErrors; 
    }
}

export const errorHandler = (err, req, res, next) => {
    // 1. Catches direct Zod validation errors if parsing using schema.parse()
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            errors: err.issues.map(issue => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
    }

    // 2. Catches operational errors intentionally thrown by your code
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            code: err.code,
            message: err.message,
            ...(err.errors && { errors: err.errors }) // Dynamically append error lists if they exist
        });
    }

    // 3. Fallback for unexpected system crashes
    logger.error("[Fatal System Crash]:", err);

    return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong."
    });
};
