import { redisClient } from "../config/redis.js";
import { logger } from "../utils/logger.js";
import { REFRESH_TOMBSTONE_TTL } from "../modules/constants/auth.js";

//storeRefreshToken()

export const storeRefreshToken = async ({
    jti,
    userId,
    type,
    ttl,
}) => {

    const sessionKey = `auth:refresh:${jti}`;
    const userSetKey = `auth:user:sessions:${userId}`;

    // Batch transaction to save the session details and index the token identifier concurrently
    const result = await redisClient
    .multi()
    .setex(
        sessionKey,
        ttl,
        JSON.stringify({
            userId,
            type,
        })
    )
    .sadd(userSetKey, jti)
    .exec();


    logger.info("MULTI RESULT:", result);

    logger.info(
        "Stored Value:",
        await redisClient.get(sessionKey)
    );

    logger.info(
        "Stored Set:",
        await redisClient.smembers(userSetKey)
    );
};

//verifyRefreshSession()
export const verifyRefreshSession = async (jti) => {

    const sessionKey = `auth:refresh:${jti}`;
    logger.info("Looking for:", sessionKey);
    // Read the session to find out which user it belongs to before killing it
    const sessionData = await redisClient.get(sessionKey);
    logger.info("Redis returned:", sessionData);
    if (!sessionData) {
        return null;
    }

    try {
        return JSON.parse(sessionData);
    } catch {
        return null;
    }
};


// consumeRefreshSession()
//
// Atomically "spends" a refresh token in a single round-trip so two concurrent
// refreshes can never both succeed (fixes the previous GET-then-DEL race).
//
//   - session present -> delete it, drop a tombstone, return { status: "OK" }
//   - session gone but tombstone present -> the token was already rotated, so
//     this is a replay: return { status: "REUSED", tombstoneAt }
//   - neither present -> expired / logged out: return { status: "MISSING" }
const CONSUME_SCRIPT = `
local session = redis.call('GET', KEYS[1])
if session then
    redis.call('DEL', KEYS[1])
    redis.call('SET', KEYS[2], ARGV[1], 'EX', ARGV[2])
    return {'OK', session}
end
local tombstone = redis.call('GET', KEYS[2])
if tombstone then
    return {'REUSED', tombstone}
end
return {'MISSING', ''}
`;

export const consumeRefreshSession = async (jti, now) => {
    const sessionKey = `auth:refresh:${jti}`;
    const tombstoneKey = `auth:refresh:used:${jti}`;

    const [status, value] = await redisClient.eval(
        CONSUME_SCRIPT,
        2,
        sessionKey,
        tombstoneKey,
        String(now),
        String(REFRESH_TOMBSTONE_TTL)
    );

    if (status === "OK") {
        try {
            return { status, session: JSON.parse(value) };
        } catch {
            return { status: "MISSING" };
        }
    }

    if (status === "REUSED") {
        return { status, tombstoneAt: Number(value) };
    }

    return { status: "MISSING" };
};


// attachRotatedSession()
//
// The old session was already deleted atomically by consumeRefreshSession(), so
// here we only need to un-index the old JTI and register the freshly minted one.
export const attachRotatedSession = async ({
    oldJti,
    newJti,
    userId,
    type,
    ttl,
}) => {
    const newSessionKey = `auth:refresh:${newJti}`;
    const userSetKey = `auth:user:sessions:${userId}`;

    await redisClient
        .multi()
        .srem(userSetKey, oldJti)
        .setex(
            newSessionKey,
            ttl,
            JSON.stringify({
                userId,
                type,
            })
        )
        .sadd(userSetKey, newJti)
        .exec();
};


export const rotateRefreshToken = async ({
    oldJti,
    newJti,
    userId,
    type,
    ttl,
}) => {
    const oldSessionKey = `auth:refresh:${oldJti}`;
    const newSessionKey = `auth:refresh:${newJti}`;
    const userSetKey = `auth:user:sessions:${userId}`;

    await redisClient
        .multi()
        .del(oldSessionKey)
        .srem(userSetKey, oldJti)
        .set(
            newSessionKey,
            JSON.stringify({
                userId,
                type,
            }),
            {
                EX: ttl,
            }
        )
        .sadd(userSetKey, newJti)
        .exec();
};

//revokeRefreshToken()
export const revokeRefreshToken = async (jti) => {
    const sessionKey = `auth:refresh:${jti}`;

    const session = await redisClient.get(sessionKey);

    if (!session) {
        return;
    }

    const { userId } = JSON.parse(session);

    const userSetKey = `auth:user:sessions:${userId}`;

    await redisClient
        .multi()
        .del(sessionKey)
        .srem(userSetKey, jti)
        .exec();
};