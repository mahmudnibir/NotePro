import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "react-hot-toast";
import { fetchAllTags, deleteTag, renameTag } from "./adminApi";
import { Trash2, Edit2, Check, X, Eye } from "lucide-react";

export function AdminTags() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await fetchAllTags();
      setTags(data);
    } catch (error) {
      toast.error("Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRename = async (tagId: string, newName: string) => {
    try {
      await renameTag(tagId, newName);
      toast.success("Tag renamed");
      setEditingId(null);
      loadTags();
    } catch (error) {
      toast.error("Failed to rename tag");
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!confirm("Delete this tag? This action cannot be undone.")) return;
    try {
      await deleteTag(tagId);
      toast.success("Tag deleted");
      loadTags();
    } catch (error) {
      toast.error("Failed to delete tag");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Tag Management</h1>
        <div className="text-sm text-muted-foreground">
          {filteredTags.length} tags
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Search Tags
        </label>
        <Input
          placeholder="Search by tag name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading tags...</div>
          ) : filteredTags.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No tags found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Tag Name</th>
                    <th className="px-6 py-4">Color</th>
                    <th className="px-6 py-4">Uses</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTags.map((tag) => (
                    <tr key={tag.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        {editingId === tag.id ? (
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="max-w-xs"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium">{tag.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tag.color && (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="text-xs text-muted-foreground">{tag.color}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs gap-1.5"
                          onClick={() => navigate(`/admin/notes?tag=${tag.name}`)}
                        >
                          <Eye className="w-3 h-3" /> {tag.count || 0}
                        </Button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {editingId === tag.id ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleRename(tag.id, editingValue)
                              }
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingId(tag.id);
                                setEditingValue(tag.name);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(tag.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
