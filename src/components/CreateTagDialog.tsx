import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { createTag } from "@/features/tags/tagsApi";
import { normalizeTagsInput } from "@/features/notes/noteUtils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (createdNames: string[]) => void;
}

export function CreateTagDialog({ open, onOpenChange, onCreated }: CreateTagDialogProps) {
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const parsedTags = useMemo(() => normalizeTagsInput(value), [value]);

  const handleCreate = async () => {
    if (parsedTags.length === 0) {
      toast.error("Enter at least one tag");
      return;
    }

    try {
      setIsSaving(true);
      const created = await Promise.all(parsedTags.map((tag) => createTag(tag)));
      const names = created.map((tag) => tag.name);
      onCreated?.(names);
      toast.success(names.length === 1 ? "Tag created" : `${names.length} tags created`);
      setValue("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create tags");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setValue("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleCreate();
              }
            }}
            placeholder="work, urgent, idea"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">Use commas to create multiple tags at once.</p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={isSaving}>
            {isSaving ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
