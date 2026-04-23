import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db.js";
import { authenticate, AuthRequest } from "./middleware.js";

export const notesRouter = Router();

notesRouter.use(authenticate);

const normalizeTags = (tags: unknown) => {
  const source = Array.isArray(tags)
    ? tags.map((tag) => String(tag))
    : typeof tags === "string"
    ? tags.split(",")
    : [];

  const normalized = source
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

  return Array.from(new Set(normalized));
};

const resolveTimestampInput = (value: unknown) => {
  if (value === null) {
    return null;
  }

  if (value === true) {
    return new Date().toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return undefined;
};

const cleanupExpiredTrash = async () => {
  await db.execute({
    sql: "DELETE FROM notes WHERE deleted_at IS NOT NULL AND deleted_at <= datetime('now','-7 days')",
    args: [],
  });
};

const getPinnedNotesCount = async (userId: string, excludeNoteId?: string) => {
  const args: string[] = [userId];
  const excludeClause = excludeNoteId ? " AND id != ?" : "";

  if (excludeNoteId) {
    args.push(excludeNoteId);
  }

  const result = await db.execute({
    sql: `SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND deleted_at IS NULL AND is_pinned = 1${excludeClause}`,
    args,
  });

  return Number(result.rows[0]?.count ?? 0);
};

const getOrCreateTagId = async (userId: string, tagName: string) => {
  const existing = await db.execute({
    sql: "SELECT id FROM tags WHERE user_id = ? AND name = ? ORDER BY id LIMIT 1",
    args: [userId, tagName],
  });

  const existingId = existing.rows[0]?.id;
  if (existingId) {
    return String(existingId);
  }

  const newTagId = uuidv4();

  try {
    await db.execute({
      sql: "INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)",
      args: [newTagId, userId, tagName],
    });
    return newTagId;
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (!code.includes("CONSTRAINT")) {
      throw error;
    }

    const retry = await db.execute({
      sql: "SELECT id FROM tags WHERE user_id = ? AND name = ? ORDER BY id LIMIT 1",
      args: [userId, tagName],
    });

    const retryId = retry.rows[0]?.id;
    if (!retryId) {
      throw error;
    }

    return String(retryId);
  }
};

notesRouter.get("/", async (req: AuthRequest, res: Response) => {
  try {
    await cleanupExpiredTrash();

    const userId = req.userId;
    const filter = req.query.filter as string;
    const view = filter === "archive" || filter === "trash" ? filter : "all";

    const whereClauses = ["n.user_id = ?"];
    if (view === "trash") {
      whereClauses.push("n.deleted_at IS NOT NULL");
    } else if (view === "archive") {
      whereClauses.push("(n.archived_at IS NOT NULL OR n.is_archived = 1)");
      whereClauses.push("n.deleted_at IS NULL");
    } else {
      whereClauses.push("n.deleted_at IS NULL");
      whereClauses.push("(n.archived_at IS NULL AND n.is_archived = 0)");
    }

    const result = await db.execute({
      sql: `SELECT n.*, group_concat(DISTINCT t.name) as tags 
            FROM notes n 
            LEFT JOIN note_tags nt ON n.id = nt.note_id 
            LEFT JOIN tags t ON nt.tag_id = t.id 
            WHERE ${whereClauses.join(" AND ")}
            GROUP BY n.id 
            ORDER BY n.is_pinned DESC, n.updated_at DESC`,
      args: [userId as string]
    });

    const notes = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      isArchived: Boolean(row.archived_at) || Boolean(row.is_archived),
      isPinned: Boolean(row.is_pinned),
      archivedAt: row.archived_at
        ? new Date(row.archived_at as string).getTime()
        : row.is_archived
        ? new Date(row.updated_at as string).getTime()
        : null,
      deletedAt: row.deleted_at
        ? new Date(row.deleted_at as string).getTime()
        : null,
      tags: row.tags ? String(row.tags).split(",") : [],
      createdAt: new Date(row.created_at as string).getTime(),
      updatedAt: new Date(row.updated_at as string).getTime(),
    }));

    res.json(notes);
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

notesRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await cleanupExpiredTrash();

    const userId = req.userId;
    const noteId = req.params.id;

    const result = await db.execute({
      sql: `SELECT n.*, group_concat(DISTINCT t.name) as tags 
            FROM notes n 
            LEFT JOIN note_tags nt ON n.id = nt.note_id 
            LEFT JOIN tags t ON nt.tag_id = t.id 
            WHERE n.user_id = ? AND n.id = ?
            GROUP BY n.id`,
      args: [userId as string, noteId]
    });

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: "Note not found" });
    }

    const note = {
      id: row.id,
      title: row.title,
      content: row.content,
      isArchived: Boolean(row.archived_at) || Boolean(row.is_archived),
      isPinned: Boolean(row.is_pinned),
      archivedAt: row.archived_at
        ? new Date(row.archived_at as string).getTime()
        : row.is_archived
        ? new Date(row.updated_at as string).getTime()
        : null,
      deletedAt: row.deleted_at
        ? new Date(row.deleted_at as string).getTime()
        : null,
      tags: row.tags ? String(row.tags).split(",") : [],
      createdAt: new Date(row.created_at as string).getTime(),
      updatedAt: new Date(row.updated_at as string).getTime(),
    };

    res.json(note);
  } catch (error) {
    console.error("Get single note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

notesRouter.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { title, content, tags, isPinned, isArchived, archivedAt, deletedAt } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const normalizedTags = normalizeTags(tags);
    const resolvedArchivedAt = resolveTimestampInput(archivedAt);
    const resolvedDeletedAt = resolveTimestampInput(deletedAt);
    const isArchivedValue = resolvedArchivedAt !== undefined
      ? resolvedArchivedAt !== null
      : Boolean(isArchived);

    if (isPinned) {
      const pinnedCount = await getPinnedNotesCount(userId as string);
      if (pinnedCount >= 5) {
        return res.status(400).json({ error: "You can only pin up to 5 notes" });
      }
    }

    const noteId = uuidv4();
    await db.execute({
      sql: "INSERT INTO notes (id, user_id, title, content, is_pinned, is_archived, archived_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        noteId,
        userId as string,
        title,
        content || "",
        isPinned ? 1 : 0,
        isArchivedValue ? 1 : 0,
        resolvedArchivedAt ?? (isArchivedValue ? new Date().toISOString() : null),
        resolvedDeletedAt ?? null,
      ],
    });

    if (normalizedTags.length > 0) {
      for (const tagName of normalizedTags) {
        const tagId = await getOrCreateTagId(userId as string, tagName);

        await db.execute({
          sql: "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)",
          args: [noteId, tagId]
        });
      }
    }

    res.status(201).json({ id: noteId, title, content, tags: normalizedTags });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

notesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;
    const { title, content, isArchived, isPinned, tags, archivedAt, deletedAt } = req.body;

    const fields: string[] = [];
    const args: unknown[] = [];

    if (title !== undefined) {
      fields.push("title = ?");
      args.push(title);
    }

    if (content !== undefined) {
      fields.push("content = ?");
      args.push(content ?? "");
    }

    if (isPinned !== undefined) {
      if (isPinned) {
        const currentNote = await db.execute({
          sql: "SELECT id, is_pinned FROM notes WHERE id = ? AND user_id = ?",
          args: [noteId, userId as string],
        });

        if (!currentNote.rows[0]) {
          return res.status(404).json({ error: "Note not found" });
        }

        const wasPinned = Boolean(currentNote.rows[0].is_pinned);
        if (!wasPinned) {
          const pinnedCount = await getPinnedNotesCount(userId as string, noteId);
          if (pinnedCount >= 5) {
            return res.status(400).json({ error: "You can only pin up to 5 notes" });
          }
        }
      }

      fields.push("is_pinned = ?");
      args.push(isPinned ? 1 : 0);
    }

    const resolvedArchivedAt = resolveTimestampInput(archivedAt);
    if (resolvedArchivedAt !== undefined || isArchived !== undefined) {
      const shouldArchive = resolvedArchivedAt !== undefined
        ? resolvedArchivedAt !== null
        : Boolean(isArchived);
      fields.push("archived_at = ?");
      args.push(resolvedArchivedAt ?? (shouldArchive ? new Date().toISOString() : null));
      fields.push("is_archived = ?");
      args.push(shouldArchive ? 1 : 0);
    }

    const resolvedDeletedAt = resolveTimestampInput(deletedAt);
    if (resolvedDeletedAt !== undefined) {
      fields.push("deleted_at = ?");
      args.push(resolvedDeletedAt);
    }

    if (fields.length > 0) {
      fields.push("updated_at = CURRENT_TIMESTAMP");
      await db.execute({
        sql: `UPDATE notes SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
        args: [...args, noteId, userId as string],
      });
    }

    if (tags !== undefined) {
      const normalizedTags = normalizeTags(tags);
      await db.execute({
        sql: "DELETE FROM note_tags WHERE note_id = ?",
        args: [noteId],
      });

      for (const tagName of normalizedTags) {
        const tagId = await getOrCreateTagId(userId as string, tagName);

        await db.execute({
          sql: "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)",
          args: [noteId, tagId],
        });
      }
    }

    res.json({ message: "Note updated successfully" });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

notesRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;
    const permanent = req.query.permanent === "true";

    if (permanent) {
      await db.execute({
        sql: "DELETE FROM notes WHERE id = ? AND user_id = ?",
        args: [noteId, userId as string],
      });
    } else {
      await db.execute({
        sql: "UPDATE notes SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
        args: [noteId, userId as string],
      });
    }

    res.json({ message: permanent ? "Note deleted permanently" : "Note moved to trash" });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

notesRouter.post("/:id/trash", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;

    await db.execute({
      sql: "UPDATE notes SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
      args: [noteId, userId as string],
    });

    res.json({ message: "Note moved to trash" });
  } catch (error) {
    console.error("Trash note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

notesRouter.post("/:id/restore", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;

    const existingNote = await db.execute({
      sql: "SELECT id, is_pinned FROM notes WHERE id = ? AND user_id = ?",
      args: [noteId, userId as string],
    });

    const note = existingNote.rows[0];
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const shouldUnpinOnRestore = note.is_pinned
      ? (await getPinnedNotesCount(userId as string, noteId)) >= 5
      : false;

    await db.execute({
      sql: "UPDATE notes SET deleted_at = NULL, is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
      args: [shouldUnpinOnRestore ? 0 : note.is_pinned ? 1 : 0, noteId, userId as string],
    });

    res.json({
      message: shouldUnpinOnRestore
        ? "Note restored and unpinned because pin limit was reached"
        : "Note restored",
    });
  } catch (error) {
    console.error("Restore note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

notesRouter.post("/:id/archive", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;

    await db.execute({
      sql: "UPDATE notes SET archived_at = CURRENT_TIMESTAMP, is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
      args: [noteId, userId as string],
    });

    res.json({ message: "Note archived" });
  } catch (error) {
    console.error("Archive note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

notesRouter.post("/:id/unarchive", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;

    await db.execute({
      sql: "UPDATE notes SET archived_at = NULL, is_archived = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
      args: [noteId, userId as string],
    });

    res.json({ message: "Note unarchived" });
  } catch (error) {
    console.error("Unarchive note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
