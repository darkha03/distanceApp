import { PrismaClient } from "../generated/prisma/client.js";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { customAlphabet } from "nanoid";



const prisma = new PrismaClient();
const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";
// REGISTER
export async function register(req, res) {
  try {
    const { email, password, username, name } = req.body;

    if (!email || !password || !username || !name) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already in use" });
    } 
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
     
    const code = nanoid(); // e.g., "4G9X7B"
    // Create user
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        username,
        name,
        code: code,
     },
    });

    const token = jwt.sign(
      { 
        userId: user.id
       },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

// LOGIN
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Please fill in both username and password" });
    }
    
    // Find user
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(    
      { userId: user.id
       },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}
