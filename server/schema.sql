PRAGMA foreign_keys = ON;

-- Core authentication users table with RBAC support.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',                    -- 'user' or 'admin' (first user = admin)
  is_suspended BOOLEAN DEFAULT 0,               -- Prevents login when 1
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notes table supports pinning, archive, soft-delete (trash), and timestamps.
CREATE TABLE IF NOT EXISTS notes (
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
);

-- User-owned tags.
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Many-to-many note/tag relationship.
CREATE TABLE IF NOT EXISTS note_tags (
  note_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Optional user categories (compatible with future folder/category UX).
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- AUDIT LOGGING (NEW - for admin panel compliance & monitoring)
-- ============================================================================

-- Complete audit trail of all important actions in the system.
-- Used for compliance, debugging, and admin monitoring.
-- Append-only: never delete records (immutable audit log).
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,                   -- e.g., 'note_created', 'user_suspended', 'user_login'
  actor_id TEXT,                               -- User who performed action (NULL = system/cron)
  target_id TEXT,                              -- Note/user/tag affected
  metadata TEXT,                               -- JSON: additional context (e.g., {"title": "My Note"})
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Query performance indexes for app views and filters.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_name ON tags(user_id, name);
CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_active ON notes(user_id, deleted_at, archived_at, is_archived);
CREATE INDEX IF NOT EXISTS idx_notes_user_pinned ON notes(user_id, is_pinned, deleted_at);
CREATE INDEX IF NOT EXISTS idx_note_tags_note ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag_id);

-- ============================================================================
-- ADMIN PANEL INDEXES (NEW - for analytics & management)
-- ============================================================================

-- Users indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Notes indexes (critical for admin queries)
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_notes_archived_at ON notes(archived_at);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Audit log indexes (critical for filtering/analytics)
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_target_id ON audit_logs(target_id);

-- ============================================================================
-- LEGACY MIGRATION STATEMENTS (for older DBs)
-- ============================================================================

-- Legacy additive migrations (for older DBs missing newer columns).
-- These statements do not delete existing rows. If a column already exists,
-- Turso may return a duplicate-column error; that can be ignored safely.
ALTER TABLE notes ADD COLUMN deleted_at DATETIME;
ALTER TABLE notes ADD COLUMN archived_at DATETIME;
ALTER TABLE tags ADD COLUMN color TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
