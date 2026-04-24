import { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { isAxiosError } from 'axios';
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
import { CreateTagDialog } from './components/CreateTagDialog';
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
import { AdminLayout } from './features/admin/AdminLayout';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { AdminAnalytics } from './features/admin/AdminAnalytics';
import { AdminUsers } from './features/admin/AdminUsers';
import { AdminNotes } from './features/admin/AdminNotes';
import { AdminAuditLogs } from './features/admin/AdminAuditLogs';
import { AdminTrash } from './features/admin/AdminTrash';
import { AdminTags } from './features/admin/AdminTags';
import api from './lib/api';

// Route Guards
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('auth_token');
  const location = useLocation();
  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('auth_token');
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        await api.get('/admin/dashboard');
        setIsAdmin(true);
      } catch {
        setIsAdmin(false);
      }
    };
    if (token) {
      checkAdmin();
    } else {
      setIsAdmin(false);
    }
  }, [token]);

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!isAdmin) {
    return <Navigate to="/notes" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

// Notes Dashboard Component
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
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const location = useLocation();

  const fetchNotes = useCallback(async (filter: NotesFilter) => {
    try {
      setIsLoading(true);
      const response = await fetchNotesApi(filter);
      setNotes(response);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const tags = await fetchTags();
      setAvailableTags(tags.map((tag) => tag.name));
    } catch {
      setAvailableTags([]);
    }
  }, []);

  useEffect(() => {
    void fetchNotes(currentFilter);
  }, [currentFilter, fetchNotes]);

  useEffect(() => {
    const queryTag = new URLSearchParams(location.search).get('tag');
    setActiveTag(queryTag ? queryTag.toLowerCase() : null);
  }, [location.search]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

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
  const listNotes = currentFilter === 'all' ? others : filteredNotes;
  const isEmptyState = !isLoading && filteredNotes.length === 0;

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
      await fetchNotes(currentFilter);
    } catch (error: unknown) {
      const message = isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined;
      toast.error(message || 'Failed to perform action');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav onMenuClick={() => setIsCommandMenuOpen(true)} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <AppContextMenu
        onNewNote={() => navigate('/note/new')}
        onNewTag={() => setIsCreateTagOpen(true)}
        onOpenArchive={() => setCurrentFilter('archive')}
        onOpenTrash={() => setCurrentFilter('trash')}
      >
        <div className="flex-grow flex overflow-hidden">
          <aside className="w-64 bg-surface border-r border-border hidden md:flex flex-col p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setCurrentFilter('all')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentFilter === 'all' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
              >
                <FileText className="w-5 h-5 mr-3 text-muted-foreground" />
                Notes
              </button>
              <button
                onClick={() => setCurrentFilter('archive')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentFilter === 'archive' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
              >
                <Archive className="w-5 h-5 mr-3 text-muted-foreground" />
                Archive
              </button>
              <button
                onClick={() => setCurrentFilter('trash')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentFilter === 'trash' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
              >
                <Trash2 className="w-5 h-5 mr-3 text-muted-foreground" />
                Trash
              </button>
            </nav>
          </aside>

          <main className="flex-1 overflow-auto px-4 pt-4 pb-6 md:px-6 md:pt-5 md:pb-7 lg:px-8">
            <div className="max-w-6xl mx-auto w-full space-y-4 md:space-y-5">
              <div className="flex flex-wrap justify-between items-start sm:items-center gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {currentFilter === 'all'
                      ? 'My Notes'
                      : currentFilter === 'archive'
                      ? 'Archived Notes'
                      : 'Trash'}
                  </h1>
                  {activeTag && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="px-2 py-1 rounded-full bg-accent text-accent-foreground">Tag: {activeTag}</span>
                      <button
                        onClick={() => {
                          setActiveTag(null);
                          navigate('/notes');
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                {currentFilter !== 'trash' && (
                  <Link
                    to="/note/new"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-block text-sm font-medium shadow-sm"
                  >
                    New Note
                  </Link>
                )}
              </div>

              {currentFilter === 'all' ? (
                <div className="space-y-3 md:space-y-4">
                  <section className="rounded-xl border border-yellow-200/70 dark:border-yellow-900/50 bg-gradient-to-b from-yellow-50/80 to-surface dark:from-yellow-900/20 dark:to-background p-3 md:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-yellow-900 dark:text-yellow-500">
                        <Pin className="w-4 h-4 text-yellow-500" />
                        Pinned
                      </div>
                      <span className="rounded-full bg-surface dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-semibold text-yellow-700 dark:text-yellow-500 ring-1 ring-yellow-200/80 dark:ring-yellow-900/50">
                        {pinned.length}/5
                      </span>
                    </div>
                    {pinned.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-yellow-300 dark:border-yellow-900/50 bg-surface dark:bg-background px-4 py-3 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">No pinned notes yet</p>
                        <p className="mt-1 text-xs text-muted-foreground">Use right-click on any note and choose Pin. Your top 5 pinned notes stay here for quick access.</p>
                      </div>
                    ) : (
                      <NotesList notes={pinned} view={currentFilter} onAction={handleNoteAction} onTagSelect={handleTagSelect} isPinnedSection />
                    )}
                  </section>

                  {isLoading ? (
                    <div className="min-h-[32vh] flex items-center justify-center text-center text-muted-foreground">Loading notes...</div>
                  ) : isEmptyState ? (
                    <div className="rounded-xl border border-border bg-surface px-6 py-7 text-center shadow-sm">
                      <div className="w-14 h-14 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-medium text-foreground mb-2">No notes found</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto mb-4">Create a note to start organizing your thoughts, or adjust your search.</p>
                      <Link to="/note/new" className="px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-block text-sm font-medium shadow-sm">
                        Create Note
                      </Link>
                    </div>
                  ) : (
                    <>
                      {others.length > 0 && (
                        <div className="flex items-center justify-between border-b border-border pb-2 pt-1">
                          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Notes</h2>
                          <span className="text-xs text-muted-foreground">{others.length} shown</span>
                        </div>
                      )}
                      {others.length === 0 ? (
                        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
                          All matching notes are pinned above.
                        </div>
                      ) : (
                        <NotesList notes={others} view={currentFilter} onAction={handleNoteAction} onTagSelect={handleTagSelect} />
                      )}
                    </>
                  )}
                </div>
              ) : isLoading ? (
                <div className="min-h-[44vh] flex items-center justify-center text-center text-muted-foreground">Loading notes...</div>
              ) : isEmptyState ? (
                <div className="flex min-h-[calc(100vh-17rem)] md:min-h-[calc(100vh-18rem)] items-center justify-center px-4">
                  <div className="mx-auto flex max-w-md -translate-y-10 md:-translate-y-12 flex-col items-center text-center rounded-xl border border-border bg-surface px-6 py-7 shadow-sm">
                    <div className="w-14 h-14 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                      {currentFilter === 'trash' ? (
                        <Trash2 className="w-8 h-8 text-muted-foreground" />
                      ) : currentFilter === 'archive' ? (
                        <Archive className="w-8 h-8 text-muted-foreground" />
                      ) : (
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="text-xl font-medium text-foreground mb-2">
                      {currentFilter === 'trash' ? 'Trash is empty' : currentFilter === 'archive' ? 'Archive is empty' : 'No notes found'}
                    </h3>
                    {currentFilter === 'archive' || currentFilter === 'trash' ? null : (
                      <>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-4">Create a note to start organizing your thoughts, or adjust your search.</p>
                        <Link to="/note/new" className="px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-block text-sm font-medium shadow-sm">
                          Create Note
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <NotesList notes={listNotes} view={currentFilter} onAction={handleNoteAction} onTagSelect={handleTagSelect} />
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
          void fetchNotes(currentFilter);
        }}
      />
      <CreateTagDialog
        open={isCreateTagOpen}
        onOpenChange={setIsCreateTagOpen}
        onCreated={(createdNames) => {
          setAvailableTags((current) => {
            const merged = new Set([...current, ...createdNames]);
            return Array.from(merged).sort((a, b) => a.localeCompare(b));
          });
          void loadTags();
        }}
      />
    </div>
  );
}

// Main App Component
export default function App() {
  return (
    <Router>
      <Toaster position="bottom-right" />
      <Routes>
        <Route path="/" element={<><LandingPage /><Footer /></>} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/notes" element={<ProtectedRoute><NotesDashboard /></ProtectedRoute>} />
        <Route path="/note/new" element={<ProtectedRoute><NoteEditor /></ProtectedRoute>} />
        <Route path="/note/:id/edit" element={<ProtectedRoute><NoteEditor /></ProtectedRoute>} />
        <Route path="/note/:id" element={<ProtectedRoute><NoteView /></ProtectedRoute>} />
        
        <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminLayout><AdminAnalytics /></AdminLayout></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminUsers /></AdminLayout></AdminRoute>} />
        <Route path="/admin/notes" element={<AdminRoute><AdminLayout><AdminNotes /></AdminLayout></AdminRoute>} />
        <Route path="/admin/audit" element={<AdminRoute><AdminLayout><AdminAuditLogs /></AdminLayout></AdminRoute>} />
        <Route path="/admin/trash" element={<AdminRoute><AdminLayout><AdminTrash /></AdminLayout></AdminRoute>} />
        <Route path="/admin/tags" element={<AdminRoute><AdminLayout><AdminTags /></AdminLayout></AdminRoute>} />
      </Routes>
    </Router>
  );
}
