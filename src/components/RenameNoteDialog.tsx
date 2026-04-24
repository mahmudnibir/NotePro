import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import type { Note } from "@/features/notes/types";
import { updateNote } from "@/features/notes/notesApi";

interface RenameNoteDialogProps {
  note: Note | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RenameNoteDialog({ note, onClose, onSaved }: RenameNoteDialogProps) {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(note?.title ?? "");
  }, [note]);

  const handleSave = async () => {
    if (!note) {
      return;
    }

    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Title is required");
      return;
    }

    try {
      setIsSaving(true);
      await updateNote(note.id, { title: trimmed });
      toast.success("Title updated");
      onSaved();
    } catch {
      toast.error("Failed to update title");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(note)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Title</DialogTitle>
        </DialogHeader>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Note title"
          autoFocus
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
