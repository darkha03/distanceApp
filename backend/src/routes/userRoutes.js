import fs from "fs";
import path from "path";
import multer from "multer";
import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  addPartner,
  getInvite,
  respondInvite,
  getResponseInvite,
  changePassword,
  updateUserStatus,
  updateAnniversary,
  uploadAvatar,
  uploadActivityImages,
  getActiveActivityImages,
  setStatusImageSet
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const baseUploadDir = path.join(process.cwd(), "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = file.fieldname === "avatar" ? "avatars" : "activity";
    const dest = path.join(baseUploadDir, sub);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only images"));
    cb(null, true);
  },
});

const router = express.Router();

router.post(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  uploadAvatar
);

router.post(
  "/activity-images",
  authMiddleware,
  upload.array("activityImages", 5),
  uploadActivityImages
);

router.get(
  "/:id/activity-images",
  authMiddleware,
  getActiveActivityImages
);

router.put("/anniversary", updateAnniversary);

router.post("/add-partner", addPartner);

router.get("/add-partner", getInvite);

router.post("/respond-invite", respondInvite);

router.get("/respond-invite", getResponseInvite);

router.post("/password", changePassword);

router.put("/status", updateUserStatus);

router.put("/:id/status-image-set", setStatusImageSet);


// Get user by ID
router.get("/:id", getUserProfile);

router.put("/:id", updateUserProfile);

router.delete("/:id", deleteUserProfile);

export default router;