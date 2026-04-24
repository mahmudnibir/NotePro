import { useState, useEffect } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "react-hot-toast";
import { fetchDeletedNotes, restoreNoteAdmin, deleteNotePermanently, bulkNoteAction } from "./adminApi";
import { Trash2, RotateCcw, Search, CheckSquare, Square, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";

export function AdminTrash() {
  const [deletedNotes, setDeletedNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingNote, setViewingNote] = useState<any>(null);

  const pageSize = 25;

  const loadDeletedNotes = async (pageNum: number) => {
    try {
      setLoading(true);
      const data = await fetchDeletedNotes(pageNum, pageSize);
      setDeletedNotes(data.data);
      setTotal(data.pagination.total);
    } catch (error) {
      toast.error("Failed to load deleted notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedNotes(page);
  }, [page]);

  const filteredNotes = deletedNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.user_email.toLowerCase().includes(search.toLowerCase())
  );

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    try {
      await bulkNoteAction(Array.from(selectedIds), action);
      toast.success(`Bulk ${action} successful`);
      setSelectedIds(new Set());
      loadDeletedNotes(page);
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

  const handleRestore = async (noteId: string) => {
    try {
      await restoreNoteAdmin(noteId);
      toast.success("Note restored");
      loadDeletedNotes();
    } catch (error) {
      toast.error("Failed to restore note");
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Permanently delete this note? This cannot be undone.")) return;
    try {
      await deleteNotePermanently(noteId);
      toast.success("Note permanently deleted");
      loadDeletedNotes();
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Trash Oversight</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border border-border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search trashed notes..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium mr-2">{selectedIds.size} selected</span>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("restore")} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleBulkAction("delete")} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Purge
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && deletedNotes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Loading trashed notes...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-12 text-center">
              <Trash2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">Trash is empty</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 w-10">
                        <button onClick={() => setSelectedIds(selectedIds.size === deletedNotes.length ? new Set() : new Set(deletedNotes.map(n => n.id)))}>
                          {selectedIds.size === deletedNotes.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      <th className="px-6 py-4">Note Info</th>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4">Deleted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredNotes.map((note) => (
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
                        <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                          {new Date(note.deleted_at).toLocaleString()}
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
                <span>Deleted: {viewingNote && new Date(viewingNote.deleted_at).toLocaleString()}</span>
              </div>
              <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Trashed</span>
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
