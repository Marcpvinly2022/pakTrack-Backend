import { AppError } from "../middlewares/errorHandler.js";

export const rateLimitHandler =
    ({
        code,
        message,
    }) =>
        (req, res, next) => {

            return next(
                new AppError(
                    429,
                    code,
                    message
                )
            );
        };