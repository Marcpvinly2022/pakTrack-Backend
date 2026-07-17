import 'dotenv/config';
console.log("🔍 DEBUG: DATABASE_URL value is ->", process.env.DATABASE_URL);
import app from './app.js';
import { redisClient } from './config/redis.js';
import { prisma } from './config/database.js';
import { verifyMailConnection } from './config/mail.js';
import "./modules/notification/notification.worker.js";

const PORT = process.env.PORT || 5000;

// Initialize database connection
try {
    console.log('🔌 Attempting to connect to database...');
    await await prisma.$connect();
    console.log('✅ Database connection established');
} catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
}

await verifyMailConnection();

// Start server
const server = app.listen(PORT, () => {
    console.log(`===========================================================`);
    console.log(`🚀 [PakTrack Core Boot]: Server listening on port: ${PORT}`);
    console.log(`⚙ [Environment Mode]: Running in ${process.env.NODE_ENV} configuration`);
    console.log(`===========================================================`);
});

const gracefulShutdown = async (signal) => {
    console.log(`\n⚠ [${signal} Received]: Commencing structural server engine shutdown...`);
    server.close(async () => {
        console.log('✔ [HTTP Server]: Express routing loops closed cleanly.');
        
        // Check if redisClient is defined and has quit method
        if (redisClient && typeof redisClient.quit === 'function') {
            await redisClient.quit();
            console.log('✔ [Redis Client]: Redis client connection terminated safely.');
        }
        
        // Disconnect Prisma
        await prisma.$disconnect();
        console.log('✔ [Prisma Client]: Database connection closed.');
        
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));