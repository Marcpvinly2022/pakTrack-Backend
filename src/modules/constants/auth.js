export const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7;

// Two legit refresh calls can race (React double-render, client retries) and
// both present the same valid token. If the replay lands within this window we
// treat it as a benign concurrent refresh instead of a stolen-token replay.
export const REFRESH_REUSE_GRACE_MS = 10 * 1000;

// Keep the tombstone for a consumed refresh token around for its full original
// lifetime, so a replayed token is still detectable right up to its expiry.
export const REFRESH_TOMBSTONE_TTL = REFRESH_TOKEN_TTL;
