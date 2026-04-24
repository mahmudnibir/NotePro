import { useState, useEffect } from "react";
import { fetchDashboardMetrics } from "./adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Users, FileText, Activity, Trash2 } from "lucide-react";
import api from "../../lib/api";

type EventType = {
  type: string;
  data: any;
};

export function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalNotes: 0,
    activeUsers: 0,
    deletedNotes: 0,
  });
  const [activeAdmins, setActiveAdmins] = useState(0);
  const [feed, setFeed] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardMetrics().then(setMetrics).catch(console.error);

    // Setup SSE
    localStorage.getItem("auth_token");
    // Native EventSource doesn't support headers well, but we can append token to URL if needed,
    // or we use a polyfill. Since we didn't add polyfill, let's use a workaround with fetch/stream 
    // or just pass token in query param.
    // Let's modify the server to allow token via query for SSE! 
    // Wait, let's just do a normal polling or fetch if SSE is hard with token.
    // Since SSE is requested, we can use a library or pass token in URL.
    // For now, I'll assume we can pass it in URL since I'll update middleware to allow token from query.
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const baseURL = api.defaults.baseURL || "http://localhost:3001/api";
    const eventSource = new EventSource(`${baseURL}/admin/realtime/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const parsed: EventType = JSON.parse(event.data);
        if (parsed.type === "connected") {
          setActiveAdmins(parsed.data.activeClients);
        } else if (parsed.type === "active_admins") {
          setActiveAdmins(parsed.data.count);
        } else if (parsed.type === "audit") {
          setFeed((prev) => [parsed.data, ...prev].slice(0, 20));
        }
      } catch (e) {
        console.error(e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-muted-foreground">{activeAdmins} Admin(s) Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalNotes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Users (7d)</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Deleted Notes</CardTitle>
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.deletedNotes}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Real-Time Activity Feed</h2>
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {feed.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Waiting for activity...</div>
              ) : (
                <ul className="divide-y divide-border">
                  {feed.map((item, i) => (
                    <li key={i} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.action_type}</p>
                        <p className="text-xs text-muted-foreground">User: {item.actor_id}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
