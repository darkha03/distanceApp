import React, { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./authContext";
import { useAuthStore } from "../utils/authStore";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = React.useContext(AuthContext);
  const { token } = useAuthStore();
  const [socket, setSocket] = useState(null);
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!token) return;

    const newSocket = io(`${BASE_URL}`, {
      auth: { token },
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
