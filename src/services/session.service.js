import { redisClient } from "../config/redis.js";

export const revokeAllSessions = async (userId) => {
    const userSetKey = `auth:user:sessions:${userId}`;

    // Fetch all active refresh token identifiers (JTIs)
    const activeJtis = await redisClient.smembers(userSetKey);

    if (!activeJtis || activeJtis.length === 0) {
        return;
    }

    // Convert JTIs into refresh-token Redis keys
    const refreshKeys = activeJtis.map(
        (jti) => `auth:refresh:${jti}`
    );

    // Delete every refresh token and the user's session index
    await redisClient.del([
        ...refreshKeys,
        userSetKey,
    ]);
};