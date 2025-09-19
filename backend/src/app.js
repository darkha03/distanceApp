import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

const app = express();

// 🔹 Middleware
app.use(cors());              // allow cross-origin requests (Expo frontend)
app.use(express.json());      // parse JSON bodies


// 🔹 Placeholder route groups
app.use("/api/auth", authRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/messages", (req, res) => res.json({ message: "message route placeholder" }));

// 🔹 Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

export default app;
