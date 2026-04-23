import api from "@/lib/api";
import type { TagRecord } from "./types";

export const fetchTags = async () => {
  const response = await api.get<TagRecord[]>("/tags");
  return response.data;
};

export const createTag = async (name: string) => {
  const response = await api.post<TagRecord>("/tags", { name });
  return response.data;
};
