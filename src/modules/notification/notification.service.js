import { prisma } from '../../config/database.js';
import { notificationQueue } from '../../jobs/notification.queue.js';

export const queueNotification = async ({
  tenantId,
  userId = null,
  clientId = null,
  recipient,
  type,
  message,
  payload,
}) => {
  const notification = await prisma.notification.create({
    data: {
        tenantId,
        userId,
        clientId,
        type,
        channel: "EMAIL",
        recipient,
        message,
        subject: "Welcome to PakTrack",
        status: "PENDING",
    }
  });

  try{
    
    await notificationQueue.add( "send-email", {
        notificationId: notification.id,
        type,
        payload,
    },
    {
      attempts: 3,
      backoff:{
        type: "exponential",
        delay: 5000,

      },

      removeOnComplete: 100,
      removeOnFail: 1000,
    }
  );


   
  }catch(error){
   console.error("eee")
    throw error;
  }
};

