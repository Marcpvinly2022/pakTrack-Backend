import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock every collaborator of authentication.service so we can drive the
// --- reuse-detection branches deterministically without a live DB/Redis. ---

vi.mock("../config/database.js", () => ({
    prisma: {
        user: { findUnique: vi.fn(), update: vi.fn() },
        client: { findUnique: vi.fn(), update: vi.fn() },
    },
}));

vi.mock("../utils/jwt.js", () => ({
    verifyRefreshToken: vi.fn(),
    generateAccessToken: vi.fn(() => "new.access.token"),
    generateRefreshToken: vi.fn(() => "new.refresh.token"),
}));

vi.mock("./refreshToken.service.js", () => ({
    consumeRefreshSession: vi.fn(),
    attachRotatedSession: vi.fn(),
    // unused by rotation but imported by the module under test
    revokeRefreshToken: vi.fn(),
    verifyRefreshSession: vi.fn(),
    storeRefreshToken: vi.fn(),
    rotateRefreshToken: vi.fn(),
}));

vi.mock("./session.service.js", () => ({
    revokeAllSessions: vi.fn(),
}));

vi.mock("./accountLockout.service.js", () => ({
    ensureAccountNotLocked: vi.fn(),
    recordFailedLoginAttempt: vi.fn(),
    resetFailedLoginAttempts: vi.fn(),
}));

vi.mock("../modules/notification/notification.service.js", () => ({
    queueNotification: vi.fn(),
}));

vi.mock("../utils/logger.js", () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { refreshTokenRotation } from "./authentication.service.js";
import { prisma } from "../config/database.js";
import { verifyRefreshToken } from "../utils/jwt.js";
import { consumeRefreshSession, attachRotatedSession } from "./refreshToken.service.js";
import { revokeAllSessions } from "./session.service.js";
import { queueNotification } from "../modules/notification/notification.service.js";

const activeAccount = {
    id: "user-1",
    tenantId: "tenant-1",
    email: "owner@agency.com",
    firstName: "Ada",
    role: "AGENCY_ADMIN",
    isActive: true,
    sessionVersion: 3,
};

beforeEach(() => {
    vi.clearAllMocks();
    verifyRefreshToken.mockReturnValue({
        sub: "user-1",
        jti: "jti-old",
        type: "USER",
    });
});

describe("refreshTokenRotation — reuse detection", () => {

    it("rotates normally when the token session is active (OK)", async () => {
        consumeRefreshSession.mockResolvedValue({
            status: "OK",
            session: { userId: "user-1", type: "USER" },
        });
        prisma.user.findUnique.mockResolvedValue(activeAccount);

        const tokens = await refreshTokenRotation("valid.refresh.jwt");

        expect(tokens).toHaveProperty("accessToken");
        expect(tokens).toHaveProperty("refreshToken");
        // Old jti un-indexed, new one registered.
        expect(attachRotatedSession).toHaveBeenCalledOnce();
        // No revocation, no alert on the happy path.
        expect(revokeAllSessions).not.toHaveBeenCalled();
        expect(queueNotification).not.toHaveBeenCalled();
    });

    it("soft-rejects a replay inside the grace window without revoking", async () => {
        consumeRefreshSession.mockResolvedValue({
            status: "REUSED",
            tombstoneAt: Date.now(), // just consumed -> concurrent refresh
        });

        await expect(
            refreshTokenRotation("racing.refresh.jwt")
        ).rejects.toMatchObject({ code: "REFRESH_IN_PROGRESS", statusCode: 409 });

        // Benign race must NOT nuke sessions or alert the user.
        expect(revokeAllSessions).not.toHaveBeenCalled();
        expect(queueNotification).not.toHaveBeenCalled();
        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("nukes all sessions and alerts on a genuine replay (outside grace)", async () => {
        consumeRefreshSession.mockResolvedValue({
            status: "REUSED",
            tombstoneAt: Date.now() - 60_000, // one minute old -> real reuse
        });
        prisma.user.update.mockResolvedValue(activeAccount);

        await expect(
            refreshTokenRotation("stolen.refresh.jwt")
        ).rejects.toMatchObject({ code: "TOKEN_REUSE_DETECTED", statusCode: 401 });

        // sessionVersion bumped -> invalidates outstanding access tokens.
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: "user-1" },
            data: { sessionVersion: { increment: 1 } },
        });
        // All refresh sessions cleared from Redis.
        expect(revokeAllSessions).toHaveBeenCalledWith("user-1");
        // Owner alerted with a usable email payload.
        expect(queueNotification).toHaveBeenCalledOnce();
        const alert = queueNotification.mock.calls[0][0];
        expect(alert.type).toBe("SECURITY_ALERT");
        expect(alert.payload.email).toBe("owner@agency.com");
    });

    it("rejects an unknown/expired token (MISSING) without revoking", async () => {
        consumeRefreshSession.mockResolvedValue({ status: "MISSING" });

        await expect(
            refreshTokenRotation("expired.refresh.jwt")
        ).rejects.toMatchObject({ code: "INVALID_REFRESH_TOKEN", statusCode: 401 });

        expect(revokeAllSessions).not.toHaveBeenCalled();
        expect(queueNotification).not.toHaveBeenCalled();
    });
});
