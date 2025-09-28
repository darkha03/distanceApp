import fs from "fs";
import path from "path";
import multer from "multer";
import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  addPartner,
  getInvite,
  respondInvite,
  getResponseInvite,
  changePassword,
  updateUserStatus,
  respondActivityImage
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const uploadDir = path.join(process.cwd(), "uploads", "activity");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only images"));
    cb(null, true);
  },
});

const router = express.Router();

// DEBUG middleware around upload
router.post(
  "/activity-image",
  authMiddleware,
  upload.single("activityImage"),
  respondActivityImage
);

// Update user profile


router.post("/add-partner", addPartner);

router.get("/add-partner", getInvite);

router.post("/respond-invite", respondInvite);

router.get("/respond-invite", getResponseInvite);

router.post("/password", changePassword);

router.put("/status", updateUserStatus);

// Get user by ID
router.get("/:id", getUserProfile);

router.put("/:id", updateUserProfile);

export default router;