import { config } from "dotenv";
import {z} from "zod";
//load variable from .env
config();

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    //database
    DATABASE_URL: z
    .string()
    .url(),

    DIRECT_DATABASE_URL: z
    .string()
    .url(),

    // Authentication
    JWT_SECRET_STAFF: z
    .string()
    .min(32),
    JWT_SECRET_TRAVELLER: z
    .string()
    .min(32),

    //redis
    REDIS_URL: z
    .string()
    .url(),
});

/**
 * Parse and validate process.env.
 * safeParse() returns an object instead of throwing immediately,
 * allowing us to format errors nicely.
 */

const parsedEnv = envSchema.safeParse(process.env);

if(!parsedEnv.success) {
    console.log("Environment validation failed.\n");
    console.error(parsedEnv.error.format());

    process.emit(1);

}

