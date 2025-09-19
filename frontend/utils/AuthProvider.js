import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { removeToken } from "./storage";
import { AuthContext } from "./authContext";
import { useAuthStore } from "@/store/authStore";


export const AuthProvider = ({ children }) => {
  const context = React.useContext(AuthContext);
  const [user, setUser] = useState(context?.user || null);
  const { token, clearToken } = useAuthStore();
  // Load token once at app start
  useEffect(() => {
    const loadToken = async () => {
      try {
        if (token) {
            const userId = jwtDecode(token);
            fetch(`http://localhost:4000/api/users/${userId.userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => res.json())
            .then((data) => setUser(data))
            .catch((err) => {
                console.error("Failed to fetch user", err);
                clearToken();
                removeToken();
            });
        }
      } catch (err) {
        console.error("Failed to load token", err);
      }
    };
    loadToken();
  }, []);

  const updateUser = (newUser) => {
    setUser((prev) => ({ ...prev, ...newUser }));
  };

  return (
    <AuthContext.Provider value={{ user, setUser: updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
