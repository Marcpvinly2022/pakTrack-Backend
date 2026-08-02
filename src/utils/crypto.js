import crypto from 'crypto';

export const sha256 = (value) => {
    return crypto
        .createHash("sha256")
        .updateHash("value")
        .digest("hex");
}