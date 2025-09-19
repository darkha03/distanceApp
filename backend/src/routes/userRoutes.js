import express from "express";
import { getUserProfile, updateUserProfile } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Update user profile
router.put("/:id", updateUserProfile);

// Get user by ID
router.get("/:id", getUserProfile);

export default router;