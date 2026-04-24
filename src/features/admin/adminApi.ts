import api from "../../lib/api";

export const fetchDashboardMetrics = async () => {
  const { data } = await api.get("/admin/dashboard");
  return data;
};

export const fetchAnalytics = async (timeRange: "7d" | "30d" = "30d") => {
  const { data } = await api.get("/admin/analytics", { params: { range: timeRange } });
  return data;
};

export const fetchUsers = async (page = 1, limit = 50, search = "") => {
  const { data } = await api.get("/admin/users", { params: { page, limit, search } });
  return data;
};

export const createUser = async (userData: any) => {
  const { data } = await api.post("/admin/users", userData);
  return data;
};

export const updateUser = async (id: string, userData: any) => {
  const { data } = await api.patch(`/admin/users/${id}`, userData);
  return data;
};

export const bulkUserAction = async (ids: string[], action: string, value?: any) => {
  const { data } = await api.post("/admin/users/bulk", { ids, action, value });
  return data;
};

export const toggleUserSuspension = async (id: string, isSuspended: boolean) => {
  const { data } = await api.post(`/admin/users/${id}/suspend`, { isSuspended });
  return data;
};

export const deleteUser = async (id: string) => {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
};

export const fetchAllNotes = async (params: { page?: number; limit?: number; userId?: string; tag?: string; search?: string }) => {
  const { data } = await api.get("/admin/notes", { params });
  return data;
};

export const bulkNoteAction = async (ids: string[], action: string) => {
  const { data } = await api.post("/admin/notes/bulk", { ids, action });
  return data;
};

export const fetchArchivedNotes = async (page = 1, limit = 50) => {
  const { data } = await api.get("/admin/notes/archived", { params: { page, limit } });
  return data;
};

export const fetchDeletedNotes = async (page = 1, limit = 50) => {
  const { data } = await api.get("/admin/notes/deleted", { params: { page, limit } });
  return data;
};

export const restoreNoteAdmin = async (noteId: string) => {
  const { data } = await api.post(`/admin/notes/${noteId}/restore`);
  return data;
};

export const deleteNotePermanently = async (noteId: string) => {
  const { data } = await api.delete(`/admin/notes/${noteId}`);
  return data;
};

export const fetchAuditLogs = async (page = 1, limit = 100) => {
  const { data } = await api.get("/admin/audit", { params: { page, limit } });
  return data;
};

export const fetchAllTags = async () => {
  const { data } = await api.get("/admin/tags");
  return data;
};

export const deleteTag = async (tagId: string) => {
  const { data } = await api.delete(`/admin/tags/${tagId}`);
  return data;
};

export const renameTag = async (tagId: string, newName: string) => {
  const { data } = await api.patch(`/admin/tags/${tagId}`, { name: newName });
  return data;
};
