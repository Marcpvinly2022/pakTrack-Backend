import { config } from "dotenv";
import { z } from "zod";
import path from "path"; // 🟩 1. Add this built-in Node import to handle file system paths safely

// 🟩 2. DYNAMIC PATH ROUTING: Check if cross-env set NODE_ENV to "test"
if (process.env.NODE_ENV === "test") {
    // Force dotenv to load your isolated test credentials instead of the main ones
    config({ path: path.resolve(process.cwd(), ".env.test") });
} else {
    // Fall back to loading your standard local .env file for development/production
    config();
}

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    
    // database
    DATABASE_URL: z.string().url(),
    DIRECT_DATABASE_URL: z.string().url(),

    // Authentication
    JWT_SECRET_STAFF: z.string().min(32),
    JWT_SECRET_TRAVELLER: z.string().min(32),

    // redis
    REDIS_URL: z.string().url(),
});

const parsedEnv = envSchema.safeParse(process.env);

if(!parsedEnv.success) {
    console.log("Environment validation failed.\n");
    console.error(parsedEnv.error.format());
    process.exit(1); 
}

// Merge the sanitized, typed configuration properties back into the global Node process.env scope
Object.assign(process.env, parsedEnv.data);

// Export the safe parsed object for internal file utilities
export const env = parsedEnv.data;
