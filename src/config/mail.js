import nodemailer from "nodemailer";

export const mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),

    secure: process.env.SMTP_SECURE ==="true",

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
        console.log(" 📧 Mail server connected successfully.")
    }catch(error){
        console.log("❌ Mail server connection failed.");
        throw error
    }
}