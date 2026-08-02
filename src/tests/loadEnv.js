// Loaded FIRST in vitest setupFiles, before any config module evaluates.
//
// config/database.js and config/redis.js read their connection strings at
// import time via `import "dotenv/config"`, which always loads plain `.env`.
// We load `.env.test` here with override:true so the test DB/Redis values win
// for the keys `.env.test` defines. Keys it does NOT define (JWT secrets, SMTP)
// are still filled in later by the config modules' own `.env` load, because
// dotenv does not overwrite already-set variables.
import dotenv from "dotenv";

dotenv.config({ path: ".env.test", override: true });
