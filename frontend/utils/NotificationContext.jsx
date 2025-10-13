import React, { createContext, useContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { useAuthStore } from "@/utils/authStore";
import Constants from "expo-constants";

// Get EAS projectId if needed for push tokens in EAS build


const NotificationContext = createContext({
  expoPushToken: null,
  notification: null,
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
  }),
});

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { token } = useAuthStore();          // (1) Hook now inside component
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  
  
  // Ask permission + get token
  useEffect(() => {
    let isMounted = true;
    console.log("NotificationProvider mounted");
    async function registerAsync() {
      if (!Device.isDevice) {
        console.log("Physical device required for push notifications");
        return;
      }

      // iOS / Android 13+: request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log("Existing notification permission status:", existingStatus);
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.log("Notification permission not granted");
        return;
      }

      // (Optional) set channel on Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }
      const projectId = 
        Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
      // Get push token (supply projectId if needed for EAS build)
      const pushToken = (await Notifications.getExpoPushTokenAsync({projectId})).data;
      console.log("Obtained Expo push token:", pushToken);
      if (isMounted) setExpoPushToken(pushToken);
    }

    registerAsync();
    console.log("Setting up notification listeners");
    const subReceive = Notifications.addNotificationReceivedListener(n => {
      console.log("Notification received:", n);
      setNotification(n);
      
    });
    const subResponse = Notifications.addNotificationResponseReceivedListener(r => {
      console.log("Notification response received:", r );
    });

    return () => {
      isMounted = false;
      subReceive.remove();
      subResponse.remove();
    };
  }, []);

  // Send token to backend when we have both auth token + expo token
  useEffect(() => {
    if (!expoPushToken || !token) return;
    (async () => {
      try {
        await fetch(`${BASE_URL}/api/users/notification-token`, {
          method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ notificationToken: expoPushToken }),
        });
      } catch (e) {
        console.log("Failed to save push token", e.message);
      }
    })();
  }, [expoPushToken, token]);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification }}>
      {children}
    </NotificationContext.Provider>
  );
}