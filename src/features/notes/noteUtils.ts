import type { Note } from "./types";

export const normalizeTagList = (tags: string[]) => {
  const normalized = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

  return Array.from(new Set(normalized));
};

export const normalizeTagsInput = (input: string) => {
  if (!input.trim()) {
    return [] as string[];
  }

  const parts = input.split(",").map((tag) => tag.trim());
  return normalizeTagList(parts);
};

export const extractTagsFromNotes = (notes: Note[]) => {
  const tagSet = new Set<string>();
  notes.forEach((note) => {
    note.tags?.forEach((tag) => {
      if (tag) {
        tagSet.add(tag);
      }
    });
  });
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
};

export const filterNotes = (notes: Note[], searchTerm: string, activeTag?: string) => {
  const term = searchTerm.trim().toLowerCase();
  const normalizedActiveTag = activeTag?.trim().toLowerCase();

  return notes.filter((note) => {
    const normalizedTags = (note.tags || []).map((tag) => tag.toLowerCase());
    const tagText = normalizedTags.join(" ");
    const searchMatch = term
      ? note.title.toLowerCase().includes(term) ||
        note.content.toLowerCase().includes(term) ||
        tagText.includes(term)
      : true;

    const tagMatch = normalizedActiveTag ? normalizedTags.includes(normalizedActiveTag) : true;

    return searchMatch && tagMatch;
  });
};

export const splitPinnedNotes = (notes: Note[]) => {
  const pinned = notes.filter((note) => note.isPinned);
  const others = notes.filter((note) => !note.isPinned);
  return { pinned, others };
};

export const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [contenteditable=''], [data-native-contextmenu='true']"
    )
  );
};
