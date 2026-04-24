import { Router, RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { db } from "./db.js";
import { authenticate, requireAdmin, AuthRequest } from "./middleware.js";
import { logAudit } from "./audit.js";
import { realtimeRouter } from "./realtime.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin as unknown as RequestHandler);
adminRouter.use("/realtime", realtimeRouter);

adminRouter.get("/dashboard", async (req, res) => {
  try {
    const totalUsers = await db.execute("SELECT COUNT(*) as count FROM users");
    const totalNotes = await db.execute("SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NULL");
    const activeUsers = await db.execute(
      "SELECT COUNT(DISTINCT user_id) as count FROM notes WHERE updated_at > datetime('now', '-7 days')"
    );
    const deletedNotes = await db.execute(
      "SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NOT NULL"
    );
    
    res.json({
      totalUsers: totalUsers.rows[0].count,
      totalNotes: totalNotes.rows[0].count,
      activeUsers: activeUsers.rows[0].count,
      deletedNotes: deletedNotes.rows[0].count,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
});

adminRouter.get("/analytics", async (req, res) => {
  try {
    const range = (req.query.range as string) || "30d";
    const days = range === "7d" ? 7 : 30;

    const userGrowth = await db.execute(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY date(created_at)
    `);

    const notesGrowth = await db.execute(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM notes 
      WHERE deleted_at IS NULL
      AND created_at > datetime('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY date(created_at)
    `);

    const tagFrequency = await db.execute(`
      SELECT t.name, COUNT(nt.tag_id) as count
      FROM tags t
      LEFT JOIN note_tags nt ON t.id = nt.tag_id
      GROUP BY t.id
      ORDER BY count DESC
      LIMIT 20
    `);

    res.json({
      userGrowth: userGrowth.rows,
      notesGrowth: notesGrowth.rows,
      tagFrequency: tagFrequency.rows,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

adminRouter.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const search = (req.query.search as string) || "";
    const offset = (page - 1) * limit;

    const whereClause = search ? "WHERE u.email LIKE ?" : "";
    const args = search ? [`%${search}%`, limit, offset] : [limit, offset];

    const users = await db.execute(`
      SELECT u.id, u.email, u.role, u.is_suspended, u.created_at, COUNT(n.id) as note_count
      FROM users u
      LEFT JOIN notes n ON u.id = n.user_id AND n.deleted_at IS NULL
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, args);

    const countResult = await db.execute(`SELECT COUNT(*) as count FROM users ${whereClause}`, search ? [`%${search}%`] : []);
    
    res.json({
      data: users.rows.map((r) => ({
        ...r,
        is_suspended: !!r.is_suspended,
      })),
      pagination: {
        page,
        limit,
        total: countResult.rows[0].count,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

adminRouter.post("/users", async (req: AuthRequest, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await db.execute({
      sql: "INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)",
      args: [id, email, hashedPassword, role || "user"],
    });

    await logAudit("admin_create_user", req.userId as string, id, { email, role });
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

adminRouter.patch("/users/:id", async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { email, role, isSuspended, password } = req.body;
    
    const updates: string[] = [];
    const args: any[] = [];

    if (email !== undefined) {
      updates.push("email = ?");
      args.push(email);
    }
    if (role !== undefined) {
      updates.push("role = ?");
      args.push(role);
    }
    if (isSuspended !== undefined) {
      updates.push("is_suspended = ?");
      args.push(isSuspended ? 1 : 0);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push("password = ?");
      args.push(hashedPassword);
    }

    if (updates.length === 0) return res.json({ success: true });

    args.push(id);
    await db.execute({
      sql: `UPDATE users SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args,
    });

    await logAudit("admin_update_user", req.userId as string, id, { updates: Object.keys(req.body) });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to update user" });
  }
});

adminRouter.post("/users/bulk", async (req: AuthRequest, res) => {
  try {
    const { ids, action, value } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "User IDs are required" });
    }

    const placeholders = ids.map(() => "?").join(",");
    
    if (action === "suspend") {
      await db.execute({
        sql: `UPDATE users SET is_suspended = ? WHERE id IN (${placeholders})`,
        args: [value ? 1 : 0, ...ids],
      });
    } else if (action === "role") {
      await db.execute({
        sql: `UPDATE users SET role = ? WHERE id IN (${placeholders})`,
        args: [value, ...ids],
      });
    } else if (action === "delete") {
      await db.execute({
        sql: `UPDATE users SET is_suspended = 1 WHERE id IN (${placeholders})`,
        args: [...ids],
      });
    }

    await logAudit(`admin_bulk_${action}`, req.userId as string, "bulk", { count: ids.length });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Bulk action failed" });
  }
});

adminRouter.post("/users/:id/suspend", async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { isSuspended } = req.body;
    
    await db.execute({
      sql: "UPDATE users SET is_suspended = ? WHERE id = ?",
      args: [isSuspended ? 1 : 0, id],
    });
    
    await logAudit(
      isSuspended ? "suspend_user" : "activate_user",
      req.userId as string,
      id
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to update user" });
  }
});

adminRouter.delete("/users/:id", async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    
    // Soft delete - suspend the user
    await db.execute({
      sql: "UPDATE users SET is_suspended = 1 WHERE id = ?",
      args: [id],
    });
    
    await logAudit("delete_user", req.userId as string, id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

adminRouter.get("/notes", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const userId = req.query.userId as string;
    const tag = req.query.tag as string;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    const conditions = ["n.deleted_at IS NULL"];
    const args: any[] = [];

    if (userId) {
      conditions.push("n.user_id = ?");
      args.push(userId);
    }
    if (tag) {
      conditions.push("n.id IN (SELECT note_id FROM note_tags nt JOIN tags t ON nt.tag_id = t.id WHERE t.name = ?)");
      args.push(tag);
    }
    if (search) {
      conditions.push("(n.title LIKE ? OR n.content LIKE ?)");
      args.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const notes = await db.execute(`
      SELECT n.id, n.title, n.content, n.created_at, n.updated_at, n.deleted_at, n.is_archived, u.email as user_email, u.id as user_id
      FROM notes n
      JOIN users u ON n.user_id = u.id
      ${whereClause}
      ORDER BY n.updated_at DESC
      LIMIT ? OFFSET ?
    `, [...args, limit, offset]);

    const countResult = await db.execute(`SELECT COUNT(*) as count FROM notes n ${whereClause}`, args);
    
    res.json({
      data: notes.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].count,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

adminRouter.post("/notes/bulk", async (req: AuthRequest, res) => {
  try {
    const { ids, action } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: "IDs required" });
    
    const placeholders = ids.map(() => "?").join(",");
    
    if (action === "delete") {
      await db.execute({
        sql: `DELETE FROM notes WHERE id IN (${placeholders})`,
        args: ids,
      });
    } else if (action === "archive") {
      await db.execute({
        sql: `UPDATE notes SET is_archived = 1, archived_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
        args: ids,
      });
    } else if (action === "restore") {
      await db.execute({
        sql: `UPDATE notes SET deleted_at = NULL WHERE id IN (${placeholders})`,
        args: ids,
      });
    }

    await logAudit(`admin_bulk_note_${action}`, req.userId as string, "bulk", { count: ids.length });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Bulk action failed" });
  }
});

adminRouter.get("/notes/archived", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    const notes = await db.execute(`
      SELECT n.id, n.title, n.content, n.created_at, n.updated_at, n.deleted_at, n.is_archived, u.email as user_email, u.id as user_id
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.deleted_at IS NULL AND n.is_archived = 1
      ORDER BY n.updated_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const countResult = await db.execute("SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NULL AND is_archived = 1");
    
    res.json({
      data: notes.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].count,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch archived notes" });
  }
});

adminRouter.get("/notes/deleted", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    const notes = await db.execute(`
      SELECT n.id, n.title, n.created_at, n.deleted_at, u.email as user_email, u.id as user_id
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.deleted_at IS NOT NULL
      ORDER BY n.deleted_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const countResult = await db.execute("SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NOT NULL");
    
    res.json({
      data: notes.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].count,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch deleted notes" });
  }
});

adminRouter.post("/notes/:id/restore", async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    
    await db.execute({
      sql: "UPDATE notes SET deleted_at = NULL WHERE id = ?",
      args: [id],
    });
    
    await logAudit("restore_note", req.userId as string, id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to restore note" });
  }
});

adminRouter.delete("/notes/:id", async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    
    await db.execute({
      sql: "DELETE FROM notes WHERE id = ?",
      args: [id],
    });
    
    await logAudit("delete_note_permanent", req.userId as string, id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

adminRouter.get("/audit", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = (page - 1) * limit;

    const logs = await db.execute(`
      SELECT a.*, u.email as actor_email
      FROM audit_logs a
      LEFT JOIN users u ON a.actor_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const countResult = await db.execute("SELECT COUNT(*) as count FROM audit_logs");
    
    res.json({
      data: logs.rows.map((row) => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata as string) : {},
      })),
      pagination: {
        page,
        limit,
        total: countResult.rows[0].count,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

adminRouter.get("/tags", async (req, res) => {
  try {
    const tags = await db.execute(`
      SELECT t.*, COUNT(nt.note_id) as count
      FROM tags t
      LEFT JOIN note_tags nt ON t.id = nt.tag_id
      GROUP BY t.id
      ORDER BY t.name ASC
    `);
    
    res.json(tags.rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

adminRouter.delete("/tags/:id", async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    
    await db.execute({
      sql: "DELETE FROM tags WHERE id = ?",
      args: [id],
    });
    
    await logAudit("delete_tag", req.userId as string, id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete tag" });
  }
});

adminRouter.patch("/tags/:id", async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    await db.execute({
      sql: "UPDATE tags SET name = ? WHERE id = ?",
      args: [name, id],
    });
    
    await logAudit("rename_tag", req.userId as string, id, { name });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to update tag" });
  }
});
