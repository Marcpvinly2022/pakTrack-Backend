// src/tests/setup.js
import { beforeAll, beforeEach } from "vitest";
import { execSync } from "child_process";
import { prisma } from "../config/database.js";
beforeAll(async () => {
    try {
        console.log("⏳ Synchronizing isolated database schema configurations...");
        execSync("npx prisma db push --accept-data-loss", { env: process.env });
    } catch (error) {
        console.error("❌ Failed to push schema initialization down to test database:", error);
        process.exit(1);
    }
});

beforeEach(async () => {
    try {
        // 🟩 CRITICAL FIX: Run cleanups independently without wrapping them inside a transaction block.
        // This avoids locking problems on PgBouncer cloud architectures.
        await prisma.user.deleteMany();
        await prisma.tenant.deleteMany();
    } catch (error) {
        console.error("❌ Failed to clear database tables cleanly before test:", error);
    }
});