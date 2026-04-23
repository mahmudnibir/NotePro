import api from "@/lib/api";
import type { Note, NotePayload, NoteUpdatePayload, NotesFilter } from "./types";

export const fetchNotes = async (filter: NotesFilter) => {
  const response = await api.get<Note[]>("/notes", {
    params: filter === "all" ? undefined : { filter },
  });
  return response.data;
};

export const fetchNote = async (id: string) => {
  const response = await api.get<Note>(`/notes/${id}`);
  return response.data;
};

export const createNote = async (payload: NotePayload) => {
  const response = await api.post<Note>("/notes", payload);
  return response.data;
};

export const updateNote = async (id: string, payload: NoteUpdatePayload) => {
  await api.put(`/notes/${id}`, payload);
};

export const trashNote = async (id: string) => {
  await api.post(`/notes/${id}/trash`);
};

export const restoreNote = async (id: string) => {
  await api.post(`/notes/${id}/restore`);
};

export const deleteNoteForever = async (id: string) => {
  await api.delete(`/notes/${id}`, { params: { permanent: true } });
};

export const archiveNote = async (id: string) => {
  await api.post(`/notes/${id}/archive`);
};

export const unarchiveNote = async (id: string) => {
  await api.post(`/notes/${id}/unarchive`);
};
