import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeft, Save } from 'lucide-react';
import TipTapEditor from './TipTapEditor';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

export function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = id !== undefined;

  useEffect(() => {
    if (isEditing) {
      loadNote();
    }
  }, [id]);

  useEffect(() => {
    if (!isEditing || !title.trim() || isLoading) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        setIsSaving(true);
        const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
        await api.put(`/notes/${id}`, { title, content, tags: tagsArray });
      } catch (error) {
        console.error('Auto-save failed', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [title, content, tags, isEditing, id, isLoading]);

  const loadNote = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/notes/${id}`);
      setTitle(response.data.title);
      setContent(response.data.content);
      setTags(response.data.tags.join(', '));
    } catch (error) {
      toast.error('Failed to load note');
      navigate('/notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      setIsLoading(true);
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
      
      const payload = { title, content, tags: tagsArray };

      if (isEditing) {
        await api.put(`/notes/${id}`, payload);
        toast.success('Note updated');
        navigate(`/note/${id}`);
      } else {
        const res = await api.post('/notes', payload);
        toast.success('Note created');
        navigate(`/note/${res.data.id}`);
      }
    } catch (error) {
      toast.error('Failed to save note');
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
            {isSaving && <span className="text-xs text-gray-500 mr-2">Saving...</span>}
            <Button onClick={handleSave} disabled={isLoading || !title.trim() || isSaving} className="bg-black text-white hover:bg-gray-800">
              <Save className="w-4 h-4 mr-2" />
              {isLoading || isSaving ? 'Saving...' : 'Save'}
            </Button>
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
