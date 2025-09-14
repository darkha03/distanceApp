import express from "express";
import { login, register } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

//Verify token
router.get("/verify", authMiddleware, (req, res) => {
  res.json({ valid: true, userId: req.user.userId });
});

export default router;
