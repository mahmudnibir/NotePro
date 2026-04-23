import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Tag, Pin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
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

interface MenuState {
  note: Note;
  x: number;
  y: number;
}

export function NotesList({ notes, view, onAction, onTagSelect, isPinnedSection }: NotesListProps) {
  const navigate = useNavigate();
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [adjustedMenuState, setAdjustedMenuState] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    return doc.body.textContent || '';
  };

  const sortedNotes = useMemo(() => [...notes].sort((a, b) => b.updatedAt - a.updatedAt), [notes]);

  useEffect(() => {
    if (!menuState) {
      setAdjustedMenuState(null);
      return;
    }

    if (!menuRef.current) {
      setAdjustedMenuState(menuState);
      return;
    }

    const padding = 10;
    const width = menuRef.current.offsetWidth;
    const height = menuRef.current.offsetHeight;

    setAdjustedMenuState({
      ...menuState,
      x: Math.min(menuState.x, window.innerWidth - width - padding),
      y: Math.min(menuState.y, window.innerHeight - height - padding),
    });
  }, [menuState]);

  useEffect(() => {
    if (!menuState) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuState(null);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      setMenuState(null);
    };

    const handleResize = () => {
      setMenuState(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuState]);

  const handleContextMenu = (event: React.MouseEvent, note: Note) => {
    event.preventDefault();
    setMenuState({ note, x: event.clientX, y: event.clientY });
  };

  const handleKeyboardMenu = (event: React.KeyboardEvent, note: Note) => {
    if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
      event.preventDefault();
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuState({ note, x: rect.left + 16, y: rect.top + 16 });
      return;
    }

    if (event.key === 'Enter') {
      navigate(`/note/${note.id}`);
    }
  };

  const runAction = (action: NoteAction) => {
    if (!menuState) {
      return;
    }

    onAction?.(action, menuState.note);
    setMenuState(null);
  };

  return (
    <>
      <div className={`grid gap-4 md:grid-cols-2 ${isPinnedSection ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
        {sortedNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => navigate(`/note/${note.id}`)}
            onContextMenu={(event) => handleContextMenu(event, note)}
            onKeyDown={(event) => handleKeyboardMenu(event, note)}
            className="cursor-pointer h-full"
            tabIndex={0}
            data-note-contextmenu
          >
            <Card className={`h-full hover:shadow-lg transition-shadow border-l-4 ${note.isPinned ? 'border-yellow-500 bg-yellow-50/40' : 'border-blue-500'} focus-within:ring-2 focus-within:ring-gray-200`}>
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
        ))}
      </div>

      {menuState &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-50 w-[176px] rounded-md border border-gray-200 bg-white p-0.5 shadow-lg animate-in fade-in-0 zoom-in-95"
            style={{ left: adjustedMenuState?.x ?? menuState.x, top: adjustedMenuState?.y ?? menuState.y }}
          >
            <button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-100" onClick={() => runAction('open')}>
              Open
            </button>
            <button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-100" onClick={() => runAction('open-new')}>
              Open in New Tab
            </button>
            <button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-100" onClick={() => runAction('edit-title')}>
              Edit Title
            </button>

            {view !== 'trash' ? (
              <>
                <div className="my-0.5 h-px bg-gray-100" />
                <button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-100" onClick={() => runAction('pin')}>
                  {menuState.note.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-100" onClick={() => runAction('archive')}>
                  {menuState.note.isArchived ? 'Restore from Archive' : 'Archive'}
                </button>
                <div className="my-0.5 h-px bg-gray-100" />
                <button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50" onClick={() => runAction('delete')}>
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <div className="my-0.5 h-px bg-gray-100" />
                <button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-100" onClick={() => runAction('restore')}>
                  Restore
                </button>
                <button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50" onClick={() => runAction('delete-forever')}>
                  Delete Permanently
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
