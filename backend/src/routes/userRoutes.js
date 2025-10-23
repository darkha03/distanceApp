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
  setStatusImageSet,
  saveNotificationToken,
  clearNotificationToken,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const upload = multer({
  storage : multer.memoryStorage(),
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

router.post("/notification-token", saveNotificationToken);
router.delete("/notification-token", clearNotificationToken);

router.put("/:id/status-image-set", setStatusImageSet);


// Get user by ID
router.get("/:id", getUserProfile);
router.put("/:id", updateUserProfile);
router.delete("/:id", deleteUserProfile);

export default router;