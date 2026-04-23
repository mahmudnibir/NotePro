import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Tag, Archive, FileText } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { AuthPage } from './components/AuthPage';
import { TopNav } from './components/TopNav';
import { CommandMenu } from './components/CommandMenu';
import { NotesList } from './components/NotesList';
import { NoteEditor } from './components/NoteEditor';
import { NoteView } from './components/NoteView';
import api from './lib/api';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('auth_token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function NotesDashboard() {
  const [notes, setNotes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'archive' | 'trash'>('all');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const url = currentFilter === 'archive' ? '/notes?filter=archive' : '/notes';
      const response = await api.get(url);
      setNotes(response.data);
    } catch (error) {
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [currentFilter]);

  const filteredNotes = notes.filter(note => {
    const term = searchTerm.toLowerCase();
    const searchMatch = note.title.toLowerCase().includes(term) || note.content.toLowerCase().includes(term);
    return searchMatch; // we handle archive/trash mainly on the backend or filter here if not using backend
  });

  // Client side filtering for archive (assuming backend returns all if no filter, or handles it)
  // Let's modify logic to just filter locally if we have them, or refetch. 
  // Wait, backend currently filters `is_archived = 0` for `/notes`.
  // We need to modify backend to accept a query param or an endpoint.

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNav onMenuClick={() => setIsCommandMenuOpen(true)} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar */}
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
             {/* Trash is not yet fully implemented, skipping to keep it simple or implement later if requested */}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">{currentFilter === 'all' ? 'My Notes' : currentFilter === 'archive' ? 'Archived Notes' : 'Notes'}</h1>
              <Link to="/note/new" className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors inline-block text-sm font-medium shadow-sm">
                New Note
              </Link>
            </div>
            
            {isLoading ? (
              <div className="text-center py-20 text-gray-500">Loading notes...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Tag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No notes found</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">Create a note to start organizing your thoughts, or adjust your search.</p>
                <Link to="/note/new" className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors inline-block text-sm font-medium shadow-sm">
                  Create Note
                </Link>
              </div>
            ) : (
              <NotesList notes={filteredNotes} onNotesUpdate={fetchNotes} />
            )}
          </div>
        </main>
      </div>
      <CommandMenu isOpen={isCommandMenuOpen} setIsOpen={setIsCommandMenuOpen} notes={notes} tags={[]} />
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
