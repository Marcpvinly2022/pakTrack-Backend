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
        // Delete in FK-safe order. Client.createdByUserId -> User is
        // onDelete: Restrict, so users cannot be removed while clients exist.
        // Deleting tenants first cascades away clients AND users (both have
        // onDelete: Cascade on tenantId), leaving nothing to restrict.
        await prisma.client.deleteMany();
        await prisma.user.deleteMany();
        await prisma.tenant.deleteMany();
    } catch (error) {
        console.error("❌ Failed to clear database tables cleanly before test:", error);
    }
});