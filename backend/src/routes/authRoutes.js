import express from "express";
import { loginUser, createUser } from "../controllers/authController.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, username, password, name } = req.body;
    const user = await createUser({ email, username, password, name });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const { token} = await loginUser({ username, password });
    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

export default router;
