import React, { useState, useEffect } from "react";
import { AuthContext } from "./authContext";
import { useAuthStore } from "@/store/authStore";
import { WidgetControl, syncWidgetWithUser } from "./widgetBridge";

export const AuthProvider = ({ children }) => {
  const { token, clearToken } = useAuthStore();
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
          syncWidgetWithUser(data);         // Sync user data with widget
        }
        console.log("Fetched user profile:", user);
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
    clearToken,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
