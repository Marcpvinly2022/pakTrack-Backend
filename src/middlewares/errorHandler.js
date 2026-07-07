// Centralized System Application Custom Exception Class
export class AppError extends Error {
    constructor(statusCode, errorCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;  // Differentiates developer bugs from expected app failures

        Error.captureStackTrace(this, this.constructor);

    }
}
// Global Central Interceptor Exception Handler Middleware
export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

// Production response strategy: Never leak low-level stack strings to the API consumer

if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
        status: 'error',
        code: err.errorCode,
        message: err.message,
        stack: err.stack
    });
}

// Production / Staging deployment response layout
return res.status(err.statusCode).json({
    status: 'error',
    code: err.errorCode,
    message: err.statusCode === 500 ? 'An unexpected internal processing fault occurred.': err.message
});


};