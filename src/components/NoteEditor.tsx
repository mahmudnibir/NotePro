import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isEditing) {
      loadNote();
    }
  }, [id]);

  useEffect(() => {
    if (isLoading) return;
    if (!title.trim()) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        setIsSaving(true);
        const tagsArray = normalizeTagsInput(tags);
        const payload = { title: title.trim(), content, tags: tagsArray };

        if (noteId) {
          await updateNote(noteId, payload);
        } else {
          const created = await createNote(payload);
          setNoteId(created.id);
          navigate(`/note/${created.id}/edit`, { replace: true });
        }

        setLastSavedAt(Date.now());
      } catch (error) {
        toast.error('Auto-save failed');
      } finally {
        setIsSaving(false);
      }
    }, 800);

    return () => clearTimeout(autoSaveTimer);
  }, [title, content, tags, noteId, isLoading, navigate]);

  const loadNote = async () => {
    try {
      setIsLoading(true);
      const response = await fetchNote(id as string);
      setTitle(response.title);
      setContent(response.content);
      setTags(response.tags.join(', '));
      setNoteId(response.id);
    } catch (error) {
      toast.error('Failed to load note');
      navigate('/notes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[80vh] flex flex-col">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-gray-50/50">
          <Button variant="ghost" onClick={() => navigate(isEditing ? `/note/${id}` : '/notes')} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2 items-center">
            {isSaving ? (
              <span className="text-xs text-gray-500 mr-2">Saving...</span>
            ) : lastSavedAt ? (
              <span className="text-xs text-gray-500 mr-2">Saved</span>
            ) : null}
            {noteId && (
              <Button onClick={() => navigate(`/note/${noteId}`)} className="bg-black text-white hover:bg-gray-800">
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
               className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-gray-300 h-auto"
               autoFocus
             />
          </div>

          <div>
             <Input
               type="text"
               value={tags}
               onChange={(e) => setTags(e.target.value)}
               placeholder="Add tags separated by commas (e.g. ideas, work, personal)"
               className="text-sm bg-gray-50 border-gray-200"
             />
          </div>

          <div className="flex-grow">
            {!isLoading || !isEditing ? (
              <TipTapEditor content={content} onChange={setContent} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">Loading editor...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
