import express from "express";
import { getPartner, deletePartner } from "../controllers/partnerController.js";

const router = express.Router();

// Get current user's partner info
router.get("/me", getPartner);

// Delete partner by ID
router.delete("/:id", deletePartner);

export default router;