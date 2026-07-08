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



const parsedEnv = envSchema.safeParse(process.env);

if(!parsedEnv.success) {
    console.log("Environment validation failed.\n");
    console.error(parsedEnv.error.format());
    process.exit(1); // Note: Changed from process.emit(1) which is invalid and hangs
}

//  CRITICAL FIX: Merge the sanitized, typed configuration properties 
// back into the global Node process.env scope for external driver adapters
Object.assign(process.env, parsedEnv.data);

// Optional Best Practice: Export the safe parsed object for internal file utilities
export const env = parsedEnv.data;
