import express from "express";
import { deletePartner } from "../controllers/partnerController.js";

const router = express.Router();


// Delete partner by ID
router.delete("/:id", deletePartner);

export default router;