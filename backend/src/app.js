import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// 🔹 Middleware
app.use(cors());              // allow cross-origin requests (Expo frontend)
app.use(express.json());      // parse JSON bodies

// 🔹 Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 🔹 Placeholder route groups
app.use("/api/auth", authRoutes);
app.use("/api/users", (req, res) => res.json({ message: "user route placeholder" }));
app.use("/api/messages", (req, res) => res.json({ message: "message route placeholder" }));

// 🔹 Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

export default app;
