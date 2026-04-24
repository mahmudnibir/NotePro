import { useState, useEffect } from "react";
import { fetchUsers, toggleUserSuspension, deleteUser, createUser, updateUser, bulkUserAction } from "./adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight, UserPlus, Search, Edit2, Shield, UserX, Trash2, CheckSquare, Square, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useNavigate } from "react-router-dom";

export function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ email: "", password: "", role: "user" });
  
  const pageSize = 25;

  const loadUsers = async (pageNum: number, searchStr = "") => {
    try {
      setLoading(true);
      const data = await fetchUsers(pageNum, pageSize, searchStr);
      setUsers(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(page, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ email: "", password: "", role: "user" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setFormData({ email: user.email, password: "", role: user.role });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        toast.success("User updated");
      } else {
        await createUser(formData);
        toast.success("User created");
      }
      setIsDialogOpen(false);
      loadUsers(page, search);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save user");
    }
  };

  const handleBulkAction = async (action: string, value?: any) => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUserAction(Array.from(selectedIds), action, value);
      toast.success(`Bulk ${action} successful`);
      setSelectedIds(new Set());
      loadUsers(page, search);
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

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(users.map(u => u.id)));
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <Button onClick={handleOpenAdd} className="gap-2">
          <UserPlus className="w-4 h-4" /> Add User
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border border-border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by email..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium mr-2">{selectedIds.size} selected</span>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("suspend", true)}>Suspend</Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("suspend", false)}>Activate</Button>
            <Button variant="destructive" size="sm" onClick={() => handleBulkAction("delete")}>Delete</Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && users.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Loading users...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 w-10">
                        <button onClick={toggleSelectAll}>
                          {selectedIds.size === users.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Notes</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} className={`hover:bg-muted/50 transition-colors ${selectedIds.has(user.id) ? 'bg-primary/5' : ''}`}>
                        <td className="px-6 py-4">
                          <button onClick={() => toggleSelect(user.id)}>
                            {selectedIds.has(user.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{user.email}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{user.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs gap-1.5"
                            onClick={() => navigate(`/admin/notes?userId=${user.id}`)}
                          >
                            <Eye className="w-3 h-3" /> {user.note_count}
                          </Button>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${user.is_suspended ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.is_suspended ? 'bg-red-500' : 'bg-green-500'}`} />
                            {user.is_suspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(user)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleBulkAction("delete")}>
                              <UserX className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-xs text-muted-foreground font-medium">
                  Showing {users.length} of {total} users
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{editingUser ? "New Password (Optional)" : "Password"}</label>
              <Input 
                type="password" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                placeholder={editingUser ? "Leave blank to keep current" : "••••••••"}
                required={!editingUser}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">User Role</label>
              <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Standard Access)</SelectItem>
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
