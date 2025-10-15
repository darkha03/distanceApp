import React, { useState, useEffect } from "react";
import { AuthContext } from "./authContext";
import { useAuthStore } from "@/utils/authStore";
import { WidgetControl, syncWidgetWithUser } from "./widgetBridge";
import { syncPartnerWidgetImage } from "./updateWidgetImage";

export const AuthProvider = ({ children }) => {
  const { token, logout } = useAuthStore();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  // Example: initial load user profile if token
  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (active && res.ok) {
          setUser(data);
          await WidgetControl.setAuthToken(token); // Sync token with widget
          syncWidgetWithUser(user);         // Sync user data with widget
          if (data?.partner?.activityImages?.length) {
            // Preload latest partner image into widget cache
            const latestImage = data.partner.activityImages[data.partner.activityImages.length - 1];
            console.log("Syncing partner widget image:", latestImage.url);
            await syncPartnerWidgetImage(latestImage.url, { returnContentUri: true }).catch((err) => {
              console.error("Failed to update widget image:", err);
            });
          }
        }
        //console.log("Fetched user profile:", data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  const value = {
    user,
    setUser,
    token,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
