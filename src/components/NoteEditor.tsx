import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeft } from 'lucide-react';
import TipTapEditor from './TipTapEditor';
import { toast } from 'react-hot-toast';
import { createNote, fetchNote, updateNote } from '../features/notes/notesApi';
import { normalizeTagsInput } from '../features/notes/noteUtils';

export function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [noteId, setNoteId] = useState<string | null>(id ?? null);
  const isEditing = id !== undefined;
  const noteIdRef = useRef<string | null>(id ?? null);
  const isSavingRef = useRef(false);
  const queuedPayloadRef = useRef<{ title: string; content: string; tags: string[] } | null>(null);
  const lastSavedSignatureRef = useRef<string>('');

  const setCurrentNoteId = (nextId: string | null) => {
    noteIdRef.current = nextId;
    setNoteId(nextId);
  };

  const loadNote = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchNote(id as string);
      setTitle(response.title);
      setContent(response.content);
      setTags(response.tags.join(', '));
      setCurrentNoteId(response.id);
      lastSavedSignatureRef.current = JSON.stringify({
        title: response.title.trim(),
        content: response.content,
        tags: normalizeTagsInput(response.tags.join(', ')),
      });
    } catch {
      toast.error('Failed to load note');
      navigate('/notes');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  const performAutoSave = useCallback(
    async (payload: { title: string; content: string; tags: string[] }) => {
      const signature = JSON.stringify(payload);
      if (signature === lastSavedSignatureRef.current) {
        return;
      }

      if (isSavingRef.current) {
        queuedPayloadRef.current = payload;
        return;
      }

      isSavingRef.current = true;
      setIsSaving(true);

      try {
        const currentNoteId = noteIdRef.current;
        if (currentNoteId) {
          await updateNote(currentNoteId, payload);
        } else {
          const created = await createNote(payload);
          setCurrentNoteId(created.id);
          navigate(`/note/${created.id}/edit`, { replace: true });
        }

        lastSavedSignatureRef.current = signature;
        setLastSavedAt(Date.now());
      } catch {
        toast.error('Auto-save failed');
      } finally {
        isSavingRef.current = false;
        const queued = queuedPayloadRef.current;
        queuedPayloadRef.current = null;

        if (queued) {
          void performAutoSave(queued);
        } else {
          setIsSaving(false);
        }
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (isEditing) {
      void loadNote();
    }
  }, [isEditing, loadNote]);

  useEffect(() => {
    if (isLoading) return;
    if (!title.trim()) return;

    const autoSaveTimer = setTimeout(async () => {
      const tagsArray = normalizeTagsInput(tags);
      const payload = { title: title.trim(), content, tags: tagsArray };
      await performAutoSave(payload);
    }, 800);

    return () => clearTimeout(autoSaveTimer);
  }, [title, content, tags, isLoading, performAutoSave]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-surface rounded-lg shadow-sm border border-border overflow-hidden min-h-[80vh] flex flex-col">
        <div className="border-b border-border p-4 flex items-center justify-between bg-muted/50">
          <Button variant="ghost" onClick={() => navigate(noteId ? `/note/${noteId}` : '/notes')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2 items-center">
            {isSaving ? (
              <span className="text-xs text-muted-foreground mr-2">Saving...</span>
            ) : lastSavedAt ? (
              <span className="text-xs text-muted-foreground mr-2">Saved</span>
            ) : null}
            {noteId && (
              <Button onClick={() => navigate(`/note/${noteId}`)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Done
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 flex-grow flex flex-col gap-6">
          <div>
             <Input
               type="text"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Note Title"
               className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/50 h-auto bg-transparent text-foreground"
               autoFocus
             />
          </div>

          <div>
             <Input
               type="text"
               value={tags}
               onChange={(e) => setTags(e.target.value)}
               placeholder="Add tags separated by commas (e.g. ideas, work, personal)"
               className="text-sm bg-background border-border focus-visible:ring-primary text-foreground placeholder:text-muted-foreground/50"
             />
          </div>

          <div className="flex-grow">
            {!isLoading || !isEditing ? (
              <TipTapEditor content={content} onChange={setContent} />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Loading editor...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
