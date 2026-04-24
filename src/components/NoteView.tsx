import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowLeft, Edit2, Tag as TagIcon, Calendar, Clock, Trash2, Archive, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Badge } from './ui/badge';
import type { Note } from '../features/notes/types';
import { archiveNote, fetchNote, restoreNote, trashNote, unarchiveNote } from '../features/notes/notesApi';

export function NoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadNote = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchNote(id as string);
      setNote(response);
    } catch {
      toast.error('Failed to load note');
      navigate('/notes');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  const handleDelete = async () => {
    try {
      await trashNote(id as string);
      toast.success('Note moved to trash');
      navigate('/notes');
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const handleArchiveToggle = async () => {
    if (!note) return;

    try {
      if (note.isArchived) {
        await unarchiveNote(note.id);
        toast.success('Note restored from archive');
      } else {
        await archiveNote(note.id);
        toast.success('Note archived');
      }
      loadNote();
    } catch {
      toast.error('Failed to update archive status');
    }
  };

  const handleRestore = async () => {
    if (!note) return;

    try {
      await restoreNote(note.id);
      toast.success('Note restored');
      navigate('/notes');
    } catch {
      toast.error('Failed to restore note');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background p-8 flex justify-center items-center text-foreground">Loading...</div>;
  }

  if (!note) {
    return <div className="min-h-screen bg-background p-8 flex justify-center items-center text-foreground">Note not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-surface rounded-lg shadow-sm border border-border overflow-hidden min-h-[80vh] flex flex-col">
        <div className="border-b border-border p-4 flex items-center justify-between bg-muted/50">
          <Button variant="ghost" onClick={() => navigate('/notes')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Notes
          </Button>
          <div className="flex gap-2">
            {note.deletedAt ? (
              <Button variant="outline" onClick={handleRestore} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleArchiveToggle} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                  <Archive className="w-4 h-4 mr-2" />
                  {note.isArchived ? 'Unarchive' : 'Archive'}
                </Button>
                <Button variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Trash
                </Button>
              </>
            )}
            {!note.deletedAt && (
              <Button onClick={() => navigate(`/note/${id}/edit`)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Note
              </Button>
            )}
          </div>
        </div>

        <div className="p-8 flex-grow flex flex-col">
          <h1 className="text-4xl font-bold text-foreground mb-6">{note.title}</h1>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8 pb-6 border-b border-border flex-wrap">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Created {new Date(note.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Updated {new Date(note.updatedAt).toLocaleDateString()}
            </div>
            
            {note.tags && note.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
                      onClick={() => navigate(`/notes?tag=${encodeURIComponent(tag)}`)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div 
            className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted"
            dangerouslySetInnerHTML={{ __html: note.content || '<p class="text-muted-foreground italic">Empty note</p>' }}
          />
        </div>
      </div>
    </div>
  );
}
