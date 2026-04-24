import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { fetchAuditLogs } from "./adminApi";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  const loadLogs = async (pageNum: number) => {
    try {
      setLoading(true);
      const data = await fetchAuditLogs(pageNum, pageSize);
      setLogs(data.data);
      setTotal(data.pagination.total);
    } catch (error) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(page);
  }, [page]);

  useEffect(() => {
    let result = logs;

    if (actionFilter) {
      result = result.filter((log) =>
        log.action_type.toLowerCase().includes(actionFilter.toLowerCase())
      );
    }

    if (userFilter) {
      result = result.filter((log) =>
        (log.actor_email || "").toLowerCase().includes(userFilter.toLowerCase())
      );
    }

    setFilteredLogs(result);
  }, [logs, actionFilter, userFilter]);

  const actionTypes = Array.from(new Set(logs.map((log) => log.action_type))).sort();
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Filter by Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
          >
            <option value="">All Actions</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Filter by User
          </label>
          <Input
            placeholder="Search by email..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Showing logs (Page {page} of {totalPages})
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No audit logs found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Target ID</th>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {log.actor_email || "System"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          <code className="text-xs bg-muted/50 px-2 py-1 rounded">
                            {log.target_id?.substring(0, 8) || "-"}...
                          </code>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata).substring(0, 50) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} total)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
