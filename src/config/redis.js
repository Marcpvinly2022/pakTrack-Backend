import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import { Queue } from 'bullmq';

dotenv.config();

const redisUrlString = process.env.REDIS_URL || 'redis://192.168.53.128:6379';

// Native URL parser extracts host and port directly from your .env string
const parsedUrl = new URL(redisUrlString);

export const redisClient = new Redis({
    host: parsedUrl.hostname,                    // Extracts: '192.168.53.128'
    port: Number(parsedUrl.port) || 6379,        // Converts '6379' string to a safe number type
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

export const notificationQueue = new Queue("notifications", {
    connection: redisClient,
});
