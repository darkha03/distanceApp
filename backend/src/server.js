import dotenv from "dotenv";
import app from "./app.js";
import http from "http";
import { initSocket } from "./utils/socket.js";
import jwt from "jsonwebtoken";
import { setUserOnline, setUserOffline } from "./utils/onlineUser.js";

dotenv.config(); ;

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const io = initSocket(server);

// Middleware to authenticate socket connections

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Unauthorized"));
  }
  try {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = payload.userId;
  next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.userId);
  setUserOnline(socket.userId, socket.id);
  socket.join(socket.userId);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    setUserOffline(socket.userId, socket.id);
  });
});

server.listen(PORT, () => console.log("Server running on 4000"));
