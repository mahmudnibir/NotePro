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
import type { Note, NotesFilter } from '../features/notes/types';

export type NoteAction =
  | 'open'
  | 'open-new'
  | 'edit-title'
  | 'pin'
  | 'archive'
  | 'delete'
  | 'restore'
  | 'delete-forever';

interface NotesListProps {
  notes: Note[];
  view: NotesFilter;
  onAction?: (action: NoteAction, note: Note) => void;
  onTagSelect?: (tag: string) => void;
  isPinnedSection?: boolean;
}

export function NotesList({ notes, view, onAction, onTagSelect, isPinnedSection }: NotesListProps) {
  const navigate = useNavigate();
  
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    return doc.body.textContent || '';
  };

  const sortedNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${isPinnedSection ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
      {sortedNotes.map((note) => (
        <ContextMenu key={note.id}>
          <ContextMenuTrigger asChild>
            <div
              onClick={() => navigate(`/note/${note.id}`)}
              className="cursor-pointer h-full"
              data-note-contextmenu
            >
              <Card className={`h-full hover:shadow-lg transition-shadow border-l-4 ${note.isPinned ? 'border-yellow-500 bg-yellow-50/40' : 'border-blue-500'}`}>
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
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs bg-gray-200 text-gray-700 hover:bg-gray-300"
                          onClick={(event) => {
                            event.stopPropagation();
                            onTagSelect?.(tag);
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onAction?.('open', note)}>Open</ContextMenuItem>
            <ContextMenuItem onClick={() => onAction?.('open-new', note)}>Open in New Tab</ContextMenuItem>
            <ContextMenuItem onClick={() => onAction?.('edit-title', note)}>Edit Title</ContextMenuItem>
            {view !== 'trash' ? (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => onAction?.('pin', note)}>{note.isPinned ? 'Unpin' : 'Pin'}</ContextMenuItem>
                <ContextMenuItem onClick={() => onAction?.('archive', note)}>{note.isArchived ? 'Restore from Archive' : 'Archive'}</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem className="text-red-600" onClick={() => onAction?.('delete', note)}>Move to Trash</ContextMenuItem>
              </>
            ) : (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => onAction?.('restore', note)}>Restore</ContextMenuItem>
                <ContextMenuItem className="text-red-600" onClick={() => onAction?.('delete-forever', note)}>Delete Permanently</ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
}
