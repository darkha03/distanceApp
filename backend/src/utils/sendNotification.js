import { Expo } from "expo-server-sdk";
const expo = new Expo();

export async function sendPushNotification(token, body, data = {}) {
  if (!token || !Expo.isExpoPushToken(token)) return;
  const messages = [{
    to: token,
    sound: "default",
    title: "Update from your partner 💕",
    body,
    data
  }];
  const chunks = expo.chunkPushNotifications(messages);
  console.log("Sending push notification", { token, body, data });
  for (const c of chunks) {
    try { await expo.sendPushNotificationsAsync(c); } catch (e) { console.error(e); }
  }
}
