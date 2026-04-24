import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db.js";
import { authenticate, AuthRequest } from "./middleware.js";

export const tagsRouter = Router();

tagsRouter.use(authenticate);

tagsRouter.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const result = await db.execute({
      sql: "SELECT id, name FROM tags WHERE user_id = ? ORDER BY name ASC",
      args: [userId as string],
    });

    res.json(
      result.rows.map((row) => ({
        id: row.id,
        name: row.name,
      }))
    );
  } catch (error) {
    console.error("Get tags error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

tagsRouter.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const name = String(req.body?.name || "")
      .trim()
      .toLowerCase();

    if (!name) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    const existing = await db.execute({
      sql: "SELECT id, name FROM tags WHERE user_id = ? AND name = ?",
      args: [userId as string, name],
    });

    if (existing.rows[0]) {
      return res.json({ id: existing.rows[0].id, name: existing.rows[0].name });
    }

    const id = uuidv4();
    await db.execute({
      sql: "INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)",
      args: [id, userId as string, name],
    });

    res.status(201).json({ id, name });
  } catch (error) {
    console.error("Create tag error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
