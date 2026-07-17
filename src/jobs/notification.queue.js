import { Queue } from "bullmq";
import { redisClient } from "../config/redis.js";

export const notificationQueue = new Queue("notifications", {
    connection:redisClient
});