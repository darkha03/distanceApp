import express from "express";
import { getUserProfile, 
        updateUserProfile, 
        addPartner,
        getInvite, 
        respondInvite,
        getResponseInvite,
        changePassword,
        updateUserStatus
    } from "../controllers/userController.js";


const router = express.Router();



router.post("/add-partner", addPartner);

router.get("/add-partner", getInvite);

router.post("/respond-invite", respondInvite);

router.get("/respond-invite", getResponseInvite);

router.post("/password", changePassword);

router.put("/status", updateUserStatus);

// Update user profile
router.put("/:id", updateUserProfile);

// Get user by ID
router.get("/:id", getUserProfile);
export default router;