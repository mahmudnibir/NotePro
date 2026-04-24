import { useState, useEffect } from "react";
import { fetchAllNotes, bulkNoteAction } from "./adminApi";
import { Card, CardContent } from "../../components/ui/card";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight, Search, Filter, Trash2, Archive, RotateCcw, CheckSquare, Square, X, Eye } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";

export function AdminNotes() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingNote, setViewingNote] = useState<any>(null);
  
  const userIdFilter = queryParams.get("userId");
  const tagFilter = queryParams.get("tag");
  const pageSize = 25;

  const loadNotes = async (pageNum: number) => {
    try {
      setLoading(true);
      const data = await fetchAllNotes({
        page: pageNum,
        limit: pageSize,
        userId: userIdFilter || undefined,
        tag: tagFilter || undefined,
        search: search || undefined
      });
      setNotes(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotes(page);
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search, userIdFilter, tagFilter]);

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    if (action === "delete" && !confirm(`Permanently delete ${selectedIds.size} notes?`)) return;
    
    try {
      await bulkNoteAction(Array.from(selectedIds), action);
      toast.success(`Bulk ${action} successful`);
      setSelectedIds(new Set());
      loadNotes(page);
    } catch {
      toast.error("Bulk action failed");
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const clearFilters = () => {
    navigate("/admin/notes");
    setSearch("");
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Notes Oversight</h1>
        {(userIdFilter || tagFilter) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="w-4 h-4" /> Clear Filters
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border border-border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search notes content..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium mr-2">{selectedIds.size} selected</span>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("archive")} className="gap-1.5">
              <Archive className="w-3.5 h-3.5" /> Archive
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleBulkAction("delete")} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        )}
      </div>

      {userIdFilter && (
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Showing notes for User ID: <span className="font-mono">{userIdFilter}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading && notes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Loading notes...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 w-10">
                        <button onClick={() => setSelectedIds(selectedIds.size === notes.length ? new Set() : new Set(notes.map(n => n.id)))}>
                          {selectedIds.size === notes.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      <th className="px-6 py-4">Note Info</th>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Dates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {notes.map((note) => (
                      <tr key={note.id} className={`hover:bg-muted/50 transition-colors cursor-pointer ${selectedIds.has(note.id) ? 'bg-primary/5' : ''}`} onClick={() => setViewingNote(note)}>
                        <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); toggleSelect(note.id); }}>
                          <button>
                            {selectedIds.has(note.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground truncate max-w-[300px]">{note.title || "Untitled Note"}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{note.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="text-primary hover:underline font-medium"
                            onClick={() => navigate(`/admin/notes?userId=${note.user_id}`)}
                          >
                            {note.user_email}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {note.is_archived ? (
                            <span className="text-amber-500 text-[10px] font-bold uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                              Archived
                            </span>
                          ) : (
                            <span className="text-emerald-500 text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-[10px] text-muted-foreground">
                            <span>Created: {new Date(note.created_at).toLocaleDateString()}</span>
                            <span>Updated: {new Date(note.updated_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-xs text-muted-foreground font-medium">
                  Page {page} of {totalPages} ({total} notes)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span>{viewingNote?.title || "Untitled Note"}</span>
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                ID: {viewingNote?.id}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-4">
              <div className="flex gap-4">
                <span>Owner: <strong>{viewingNote?.user_email}</strong></span>
                <span>Created: {viewingNote && new Date(viewingNote.created_at).toLocaleString()}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${viewingNote?.is_archived ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {viewingNote?.is_archived ? 'Archived' : 'Active'}
              </span>
            </div>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-6 rounded-xl border border-border min-h-[200px]"
              dangerouslySetInnerHTML={{ __html: viewingNote?.content || "<p class='text-muted-foreground italic'>No content</p>" }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
