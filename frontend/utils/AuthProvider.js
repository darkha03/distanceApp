import React, { useState, useEffect } from "react";
import { AuthContext } from "./authContext";
import { useAuthStore } from "@/store/authStore";

export const AuthProvider = ({ children }) => {
  const { token, clearToken } = useAuthStore();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const res = await fetch("http://localhost:4000/api/users/me", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (active && res.ok) setUser(data);
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
