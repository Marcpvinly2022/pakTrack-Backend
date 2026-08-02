import rateLimit from "express-rate-limit";
import { rateLimitHandler } from "../utils/rateLimitResponse.js";
import { redisClient } from "../config/redis.js";
import {RedisStore} from "rate-limit-redis";
import { rateLimitKeyGenerator, loginKeyGenerator, refreshKeyGenerator, resetPasswordKeyGenerator } from "../utils/rateLimitKeyGenerator.js";


const redisStore = new RedisStore({
    sendCommand: (command, ...args) =>
        redisClient.call(command, ...args),

    prefix: "auth:limiter:",
});


const baseLimiter = {
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    validate: { trustProxy: true},
    keyGenerator: rateLimitKeyGenerator,
};

export const loginLimiter = rateLimit({

    ...baseLimiter,
    keyGenerator: loginKeyGenerator,

    windowMs: 12 * 60 * 1000,

    max: 10,

    handler: rateLimitHandler({
        code: "TOO_MANY_LOGIN_ATTEMPTS",
        message:
            "Too many login attempts. Please try again in 12 minutes.",
    }),
});


export const refreshLimiter = rateLimit({

    ...baseLimiter,
    keyGenerator: refreshKeyGenerator,

    windowMs: 15 * 60 * 1000,

    max: 20,

    handler: rateLimitHandler({
        code: "TOO_MANY_REFRESH_REQUESTS",
        message:
            "Too many refresh requests. Please try again later.",
    }),
});



export const apiLimiter = rateLimit({

    ...baseLimiter,

    windowMs: 15 * 60 * 1000,

    max: 100,

    handler: rateLimitHandler({
        code: "TOO_MANY_REQUESTS",
        message:
            "Too many requests. Please slow down.",
    }),
});


export const forgotPasswordLimiter = rateLimit({
    ...baseLimiter,

    keyGenerator: loginKeyGenerator,

    windowMs: 15 * 60 * 1000,

    max: 5,

    message: {
        success: false,
        code: "TOO_MANY_PASSWORD_RESET_REQUESTS",
        message:
            "Too many password reset requests. Please try again later.",
    },
});


export const resetPasswordLimiter = rateLimit({
    ...baseLimiter,

    keyGenerator: resetPasswordKeyGenerator,

    windowMs: 15 * 60 * 1000,

    max: 10,

    message: {
        success: false,
        code: "TOO_MANY_RESET_ATTEMPTS",
        message:
            "Too many password reset attempts. Please try again later.",
    },
});