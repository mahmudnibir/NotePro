import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-default-key";

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Check if user is suspended
    const result = await db.execute({
      sql: "SELECT is_suspended FROM users WHERE id = ?",
      args: [decoded.userId]
    });
    
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.is_suspended) {
      return res.status(403).json({ error: "Account is suspended" });
    }
    
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const result = await db.execute({
      sql: "SELECT role FROM users WHERE id = ?",
      args: [req.userId]
    });
    const user = result.rows[0];
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
};
