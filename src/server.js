import { logger } from './utils/logger.js';
import 'dotenv/config';

// ========================================================
// 🛡️ UN-NESTED FLATTENED EMERGENCY SHIELD
// ========================================================
process.on("uncaughtException", (error) => {
    console.error("\n────────────────────────────────────────────────────────");
    console.error("🚨 [PAKTRACK RUNTIME CRASH DETECTED]:");
    console.error("Message Context:", error.message);
    console.error("Exact File Row Line Stack Trace:\n", error.stack);
    console.error("────────────────────────────────────────────────────────\n");
    
    // Force immediate safe exit so nodemon can cleanly refresh your window
    process.exit(1); 
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("\n────────────────────────────────────────────────────────");
    console.error("⚠️ [PAKTRACK UNHANDLED PROMISE REJECTION]:");
    console.error("Reason:", reason?.stack || reason);
    console.error("────────────────────────────────────────────────────────\n");
    process.exit(1);
});

// Continue with your normal boot logs downstream
logger.info("🔍 DEBUG: DATABASE_URL value is ->", process.env.DATABASE_URL);
import app from './app.js';
import { redisClient } from './config/redis.js';
import { prisma } from './config/database.js';
import { verifyMailConnection } from './config/mail.js';

import "./modules/notification/notification.worker.js";

const PORT = process.env.PORT || 5000;

// Initialize database connection
try {
    logger.info('🔌 Attempting to connect to database...');
    await await prisma.$connect();
    logger.info('✅ Database connection established');
} catch (error) {
    logger.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
}

await verifyMailConnection();

// Start server
const server = app.listen(PORT, () => {
    console.log(`===========================================================`);
    logger.info(`🚀 [PakTrack Core Boot]: Server listening on port: ${PORT}`);
    logger.info(`⚙ [Environment Mode]: Running in ${process.env.NODE_ENV} configuration`);
    console.log(`===========================================================`);
});

const gracefulShutdown = async (signal) => {
    logger.info(`\n⚠ [${signal} Received]: Commencing structural server engine shutdown...`);
    server.close(async () => {
        console.log('✔ [HTTP Server]: Express routing loops closed cleanly.');
        
        // Check if redisClient is defined and has quit method
        if (redisClient && typeof redisClient.quit === 'function') {
            await redisClient.quit();
            logger.info('✔ [Redis Client]: Redis client connection terminated safely.');
        }
        
        // Disconnect Prisma
        await prisma.$disconnect();
        logger.info('✔ [Prisma Client]: Database connection closed.');
        
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));