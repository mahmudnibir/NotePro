import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Tag, Pin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
}

export function NotesList({ notes, onNotesUpdate }: { notes: Note[]; onNotesUpdate?: () => void }) {
  const navigate = useNavigate();
  
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    return doc.body.textContent || '';
  };

  const handleAction = async (action: string, note: Note) => {
    try {
      if (action === 'delete') {
        await api.delete(`/notes/${note.id}`);
        toast.success('Note deleted');
      } else if (action === 'archive') {
        await api.put(`/notes/${note.id}`, { ...note, isArchived: !note.isArchived });
        toast.success(note.isArchived ? 'Note unarchived' : 'Note archived');
      } else if (action === 'pin') {
        const pinnedCount = notes.filter(n => n.isPinned).length;
        if (!note.isPinned && pinnedCount >= 5) {
          toast.error('You can only pin up to 5 notes');
          return;
        }
        await api.put(`/notes/${note.id}`, { ...note, isPinned: !note.isPinned });
        toast.success(note.isPinned ? 'Note unpinned' : 'Note pinned');
      } else if (action === 'open-new') {
        window.open(`/note/${note.id}`, '_blank');
        return; 
      } else if (action === 'edit') {
        const newTitle = window.prompt('Enter new title:', note.title);
        if (newTitle && newTitle.trim() !== '') {
          await api.put(`/notes/${note.id}`, { ...note, title: newTitle.trim() });
          toast.success('Title updated');
        } else {
          return;
        }
      }
      if (onNotesUpdate) onNotesUpdate();
    } catch (e) {
      toast.error('Failed to perform action');
    }
  };

  // Sort notes: pinned first, then by updated date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedNotes.map((note) => (
        <ContextMenu key={note.id}>
          <ContextMenuTrigger asChild>
            <div onClick={() => navigate(`/note/${note.id}`)} className="cursor-pointer h-full">
              <Card className={`h-full hover:shadow-lg transition-shadow border-l-4 ${note.isPinned ? 'border-yellow-500' : 'border-blue-500'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className={`text-lg font-bold ${note.isPinned ? 'text-yellow-700' : 'text-blue-700'}`}>{note.title}</CardTitle>
                    {note.isPinned && <Pin className="w-4 h-4 text-yellow-500 fill-current" />}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    <Clock className="w-3 h-3 ml-2 mr-1" />
                    <span>{new Date(note.updatedAt).toLocaleTimeString()}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 line-clamp-3">{stripHtml(note.content)}</p>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-2 text-gray-500" />
                    <div className="flex flex-wrap gap-1">
                      {note.tags && note.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-gray-200 text-gray-700">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => handleAction('open-new', note)}>Open in New Tab</ContextMenuItem>
            <ContextMenuItem onClick={() => handleAction('edit', note)}>Edit Title</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleAction('pin', note)}>{note.isPinned ? 'Unpin' : 'Pin'}</ContextMenuItem>
            <ContextMenuItem onClick={() => handleAction('archive', note)}>{note.isArchived ? 'Unarchive' : 'Archive'}</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem className="text-red-600" onClick={() => handleAction('delete', note)}>Delete</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
}
