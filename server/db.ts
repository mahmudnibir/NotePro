import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.VITE_TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

export const db = createClient({
  url,
  authToken,
});

const ensureBaseTables = async () => {
  await db.batch(
    [
      "PRAGMA foreign_keys = ON",
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        folder_id TEXT,
        is_pinned BOOLEAN NOT NULL DEFAULT 0,
        is_archived BOOLEAN NOT NULL DEFAULT 0,
        archived_at DATETIME,
        deleted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action_type TEXT NOT NULL,
        actor_id TEXT,
        target_id TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ],
    "write"
  );
};

const getExistingColumns = async (tableName: string) => {
  const result = await db.execute(`PRAGMA table_info(${tableName})`);
  return new Set(result.rows.map((row) => String(row.name)));
};

const addColumnIfMissing = async (
  tableName: string,
  columnName: string,
  columnDefinition: string
) => {
  const columns = await getExistingColumns(tableName);
  if (columns.has(columnName)) {
    return;
  }

  await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
};

export const ensureDatabaseSchema = async () => {
  await ensureBaseTables();

  await addColumnIfMissing("notes", "folder_id", "folder_id TEXT");
  await addColumnIfMissing("notes", "is_pinned", "is_pinned BOOLEAN NOT NULL DEFAULT 0");
  await addColumnIfMissing("notes", "is_archived", "is_archived BOOLEAN NOT NULL DEFAULT 0");
  await addColumnIfMissing("notes", "archived_at", "archived_at DATETIME");
  await addColumnIfMissing("notes", "deleted_at", "deleted_at DATETIME");
  await addColumnIfMissing("notes", "created_at", "created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  await addColumnIfMissing("notes", "updated_at", "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");

  await addColumnIfMissing("tags", "color", "color TEXT");
  
  await addColumnIfMissing("users", "role", "role TEXT DEFAULT 'user'");
  await addColumnIfMissing("users", "is_suspended", "is_suspended BOOLEAN DEFAULT 0");

  await db.batch(
    [
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_name ON tags(user_id, name)",
      "CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_notes_user_active ON notes(user_id, deleted_at, archived_at, is_archived)",
      "CREATE INDEX IF NOT EXISTS idx_notes_user_pinned ON notes(user_id, is_pinned, deleted_at)",
      "CREATE INDEX IF NOT EXISTS idx_note_tags_note ON note_tags(note_id)",
      "CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag_id)",
      "CREATE INDEX IF NOT EXISTS idx_audit_action_type ON audit_logs(action_type)",
      "CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id)",
      "CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(deleted_at)",
    ],
    "write"
  );
};
