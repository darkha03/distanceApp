import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import partnerRoutes from "./routes/partnerRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

const app = express();

// 🔹 Middleware
app.use(cors());              // allow cross-origin requests (Expo frontend)
app.use(express.json());      // parse JSON bodies


// 🔹 Placeholder route groups
app.use("/api/auth", authRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/partners", authMiddleware, partnerRoutes);

// 🔹 Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

export default app;
