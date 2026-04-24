import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db.js";
import { logAudit } from "./audit.js";

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-default-key";

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email]
    });

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // First user becomes admin? Let's just make sure we insert role
    const isFirstUser = (await db.execute("SELECT COUNT(*) as count FROM users")).rows[0].count === 0;
    const role = isFirstUser ? 'admin' : 'user';

    await db.execute({
      sql: "INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)",
      args: [userId, email, hashedPassword, role]
    });

    await logAudit("user_registered", userId, userId, { email, role });

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: userId, email, role } });
  } catch {
    console.error("Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email]
    });

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.is_suspended) {
      return res.status(403).json({ error: "Account is suspended" });
    }

    await logAudit("user_login", user.id as string, user.id as string);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch {
    console.error("Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const result = await db.execute({
      sql: "SELECT id, email, role FROM users WHERE id = ?",
      args: [decoded.userId]
    });

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});
