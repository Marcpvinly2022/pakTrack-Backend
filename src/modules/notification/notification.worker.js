import { Worker } from "bullmq";
import { redisClient } from "../../config/redis.js";
import { prisma } from "../../config/database.js";
import { mailTransporter } from "../../config/mail.js";
import { welcomeStaffTemplate } from "../../templates/email/welcomeStaff.template.js";
import { welcomeClientTemplate } from "../../templates/email/welcomeClient.template.js";

const subjects = {
    STAFF_ACCOUNT_CREATED: "Welcome to PaKTrack",
    CLIENT_ACCOUNT_CREATED: ({ agencyName }) => `Welcome to ${agencyName}`,
};


export const notificationWorker = new Worker(
    "notifications",
    async (job) => {
        const {
            notificationId,
            type,
            payload,
        } = job.data;

        try {

            console.log(`[Notification Worker] Processing notification ${notificationId}`);
             // Update notification status.
            // PENDING → PROCESSING
            await prisma.notification.update({
                where: {
                    id: notificationId,
                },
                data: {
                    status: "PROCESSING",
                },
            });


            
            // Ensure this notification type is supported.
            if (!(type in subjects)) {
                throw new Error(`Unsupported notification type: ${type}`);
            }

            // Generate email HTML.
            let html;
            switch (type) {

                case "STAFF_ACCOUNT_CREATED":
                    html = welcomeStaffTemplate(payload);
                    break;

                case "CLIENT_ACCOUNT_CREATED":
                    html = welcomeClientTemplate(payload);
                    break;

                default:
                    throw new Error(`Unsupported notification type: ${type}`);
            }

            // Resolve the email subject.
            // Some subjects are dynamic.
            const subject =
                typeof subjects[type] === "function"
                    ? subjects[type](payload)
                    : subjects[type];

            // Send the email.
            await mailTransporter.sendMail({
                from: process.env.MAIL_FROM,
                to: payload.email,
                subject,
                html,
            });

            await prisma.notification.update({
                where: {
                    id: notificationId,
                },
                data: {
                    status: "SENT",
                    sentAt: new Date(),
                }
            })
            console.log(`[Notification Worker] Email sent to ${payload.email}`);

        } catch (error) {
            console.error(`[Notification Worker] Failed notification ${notificationId}`, error);
            await prisma.notification.update({
                where: {
                    id: notificationId,
                },

                data: {
                    status: "FAILED"
                    
                },
            })
            throw error;
        }
    },

    {
        connection: redisClient,
        skipVersionCheck: true
    }


)


notificationWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed.`);
});

notificationWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed.`, err);
});

