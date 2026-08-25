import nodemailer from "nodemailer";
import { logger } from "../utils/logger.js";
export const mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),

    secure: process.env.SMTP_SECURE ==="true",
    // Force IPv4 resolution
    dns_result_order: 'ipv4first', 

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },

    // Added: Bypasses the self-signed network certificate validation crash
    tls: {
        rejectUnauthorized: false
    }
});

export const verifyMailConnection = async () => {
    try{
        await mailTransporter.verify();
        logger.info(" 📧 Mail server connected successfully.")
    }catch(error){
        logger.warn("❌ Mail server connection failed.");
        throw error
    }
}