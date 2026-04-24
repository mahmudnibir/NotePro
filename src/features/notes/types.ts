export type NotesFilter = "all" | "archive" | "trash";

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
  archivedAt?: number | null;
  deletedAt?: number | null;
}

export interface NotePayload {
  title: string;
  content: string;
  tags: string[];
  isPinned?: boolean;
  archivedAt?: number | null;
  deletedAt?: number | null;
}

export interface NoteUpdatePayload {
  title?: string;
  content?: string;
  tags?: string[];
  isPinned?: boolean;
  archivedAt?: number | null;
  deletedAt?: number | null;
}
