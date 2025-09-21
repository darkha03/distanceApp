import React, { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./authContext";
import { useAuthStore } from "../store/authStore";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = React.useContext(AuthContext);
  const { token } = useAuthStore();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const newSocket = io("http://localhost:4000", {
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
