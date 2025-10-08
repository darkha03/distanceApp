import { getIO } from "./socket.js";
import { isUserOnline } from "./onlineUser.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { sendPushNotification } from "./sendNotification.js";
const prisma = new PrismaClient();

export async function notifyPartner(partnerId, event, payload, pushMessageBuilder) {
  const io = getIO();
  io.to(partnerId).emit(event, payload);

  if ( !isUserOnline(partnerId) && pushMessageBuilder) {
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: { notificationToken: true }
    });
    if (partner?.notificationToken) {
      const { body, data } = pushMessageBuilder(payload);
      await sendPushNotification(partner.notificationToken, body, data);
      console.log("Sent push notification to user", partnerId);
    }
  }
}