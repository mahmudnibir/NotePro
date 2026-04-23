import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Archive, FileText, Trash2, Pin } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { AuthPage } from './components/AuthPage';
import { TopNav } from './components/TopNav';
import { CommandMenu } from './components/CommandMenu';
import { NotesList } from './components/NotesList';
import type { NoteAction } from './components/NotesList';
import { NoteEditor } from './components/NoteEditor';
import { NoteView } from './components/NoteView';
import { AppContextMenu } from './components/AppContextMenu';
import { RenameNoteDialog } from './components/RenameNoteDialog';
import {
  archiveNote,
  deleteNoteForever,
  fetchNotes as fetchNotesApi,
  restoreNote,
  trashNote,
  unarchiveNote,
  updateNote,
} from './features/notes/notesApi';
import { fetchTags } from './features/tags/tagsApi';
import type { Note, NotesFilter } from './features/notes/types';
import { extractTagsFromNotes, filterNotes, splitPinnedNotes } from './features/notes/noteUtils';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('auth_token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function NotesDashboard() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<NotesFilter>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [noteToRename, setNoteToRename] = useState<Note | null>(null);
  const location = useLocation();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const response = await fetchNotesApi(currentFilter);
      setNotes(response);
    } catch (error) {
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [currentFilter]);

  useEffect(() => {
    const queryTag = new URLSearchParams(location.search).get('tag');
    setActiveTag(queryTag ? queryTag.toLowerCase() : null);
  }, [location.search]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await fetchTags();
        setAvailableTags(tags.map((tag) => tag.name));
      } catch (error) {
        setAvailableTags([]);
      }
    };

    loadTags();
  }, []);

  const derivedTags = useMemo(() => extractTagsFromNotes(notes), [notes]);
  const mergedTags = useMemo(() => {
    const tagSet = new Set([...availableTags, ...derivedTags]);
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [availableTags, derivedTags]);

  const filteredNotes = useMemo(
    () => filterNotes(notes, searchTerm, activeTag || undefined),
    [notes, searchTerm, activeTag]
  );

  const { pinned, others } = useMemo(() => splitPinnedNotes(filteredNotes), [filteredNotes]);

  const handleTagSelect = (tag: string) => {
    setActiveTag(tag);
    navigate(`/notes?tag=${encodeURIComponent(tag)}`);
  };

  const handleNoteAction = async (action: NoteAction, note: Note) => {
    if (action === 'open') {
      navigate(`/note/${note.id}`);
      return;
    }

    if (action === 'open-new') {
      window.open(`/note/${note.id}`, '_blank');
      return;
    }

    if (action === 'edit-title') {
      setNoteToRename(note);
      return;
    }

    try {
      if (action === 'pin') {
        const pinnedCount = notes.filter((item) => item.isPinned).length;
        if (!note.isPinned && pinnedCount >= 5) {
          toast.error('You can only pin up to 5 notes');
          return;
        }
        await updateNote(note.id, { isPinned: !note.isPinned });
        toast.success(note.isPinned ? 'Note unpinned' : 'Note pinned');
      }

      if (action === 'archive') {
        if (note.isArchived) {
          await unarchiveNote(note.id);
          toast.success('Note restored from archive');
        } else {
          await archiveNote(note.id);
          toast.success('Note archived');
        }
      }

      if (action === 'delete') {
        await trashNote(note.id);
        toast.success('Note moved to trash');
      }

      if (action === 'restore') {
        await restoreNote(note.id);
        toast.success('Note restored');
      }

      if (action === 'delete-forever') {
        await deleteNoteForever(note.id);
        toast.success('Note deleted permanently');
      }

      fetchNotes();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to perform action');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNav onMenuClick={() => setIsCommandMenuOpen(true)} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <AppContextMenu
        onNewNote={() => navigate('/note/new')}
        onNewTag={() => setIsCommandMenuOpen(true)}
        onOpenArchive={() => setCurrentFilter('archive')}
        onOpenTrash={() => setCurrentFilter('trash')}
      >
        <div className="flex-grow flex overflow-hidden">
          <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setCurrentFilter('all')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentFilter === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <FileText className="w-5 h-5 mr-3 text-gray-500" />
                Notes
              </button>
              <button
                onClick={() => setCurrentFilter('archive')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentFilter === 'archive' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Archive className="w-5 h-5 mr-3 text-gray-500" />
                Archive
              </button>
              <button
                onClick={() => setCurrentFilter('trash')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentFilter === 'trash' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Trash2 className="w-5 h-5 mr-3 text-gray-500" />
                Trash
              </button>
            </nav>
          </aside>

          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {currentFilter === 'all'
                      ? 'My Notes'
                      : currentFilter === 'archive'
                      ? 'Archived Notes'
                      : 'Trash'}
                  </h1>
                  {activeTag && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <span className="px-2 py-1 rounded-full bg-gray-100">Tag: {activeTag}</span>
                      <button
                        onClick={() => {
                          setActiveTag(null);
                          navigate('/notes');
                        }}
                        className="text-xs text-gray-500 hover:text-gray-800"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                {currentFilter !== 'trash' && (
                  <Link
                    to="/note/new"
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors inline-block text-sm font-medium shadow-sm"
                  >
                    New Note
                  </Link>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Pin className="w-4 h-4 text-yellow-500" />
                    Pinned
                  </div>
                  {pinned.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white/80 p-4 text-sm text-gray-500">
                      Pin up to 5 notes for quick access.
                    </div>
                  ) : (
                    <NotesList
                      notes={pinned}
                      view={currentFilter}
                      onAction={handleNoteAction}
                      onTagSelect={handleTagSelect}
                      isPinnedSection
                    />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700">Quick Access</div>
                  <button
                    onClick={() => setCurrentFilter('archive')}
                    className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 hover:border-gray-300"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => setCurrentFilter('trash')}
                    className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 hover:border-gray-300"
                  >
                    Trash
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-20 text-gray-500">Loading notes...</div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No notes found</h3>
                  <p className="text-gray-500 max-w-sm mx-auto mb-6">Create a note to start organizing your thoughts, or adjust your search.</p>
                  {currentFilter !== 'trash' && (
                    <Link to="/note/new" className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors inline-block text-sm font-medium shadow-sm">
                      Create Note
                    </Link>
                  )}
                </div>
              ) : (
                <NotesList
                  notes={others}
                  view={currentFilter}
                  onAction={handleNoteAction}
                  onTagSelect={handleTagSelect}
                />
              )}
            </div>
          </main>
        </div>
      </AppContextMenu>
      <CommandMenu isOpen={isCommandMenuOpen} setIsOpen={setIsCommandMenuOpen} notes={notes} tags={mergedTags} />
      <RenameNoteDialog
        note={noteToRename}
        onClose={() => setNoteToRename(null)}
        onSaved={() => {
          setNoteToRename(null);
          fetchNotes();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Toaster position="bottom-right" />
      <Routes>
        <Route path="/" element={<><LandingPage /><Footer /></>} />
        <Route path="/auth" element={<AuthPage />} />
        
        <Route 
          path="/notes" 
          element={
            <ProtectedRoute>
              <NotesDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/note/new" 
          element={
            <ProtectedRoute>
              <NoteEditor />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/note/:id/edit" 
          element={
            <ProtectedRoute>
              <NoteEditor />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/note/:id" 
          element={
            <ProtectedRoute>
              <NoteView />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}
