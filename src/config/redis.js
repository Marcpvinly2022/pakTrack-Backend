import {Redis} from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://192.168.53.128:6379';

export const redisClient = new Redis(redisUrl,{
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;

    }
});

redisClient.on('connect', () => {
    console.log('✔ [Redis Engine]: Distributed key-value store connected successfully.');
});

redisClient.on('error', (err) => {
    console.log('✖ [Redis Critical Error]: Network broker connection failed:', err.message);
});
