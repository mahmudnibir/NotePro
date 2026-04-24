import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "../../components/ui/button";
import { fetchAnalytics } from "./adminApi";
import { toast } from "react-hot-toast";

export function AdminAnalytics() {
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [notesGrowth, setNotesGrowth] = useState<any[]>([]);
  const [tagFrequency, setTagFrequency] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("30d");
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await fetchAnalytics(timeRange);
      setUserGrowth(data.userGrowth || []);
      setNotesGrowth(data.notesGrowth || []);
      setTagFrequency(data.tagFrequency || []);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <div className="flex gap-2">
          <Button
            variant={timeRange === "7d" ? "default" : "outline"}
            onClick={() => setTimeRange("7d")}
            size="sm"
          >
            Last 7 Days
          </Button>
          <Button
            variant={timeRange === "30d" ? "default" : "outline"}
            onClick={() => setTimeRange("30d")}
            size="sm"
          >
            Last 30 Days
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                   dataKey="date" 
                   stroke="hsl(var(--muted-foreground))"
                   style={{ fontSize: "12px" }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))"
                  }}
                  itemStyle={{ color: "hsl(var(--primary))" }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes Created</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={notesGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                   dataKey="date" 
                   stroke="hsl(var(--muted-foreground))"
                   style={{ fontSize: "12px" }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))"
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--chart-1))"
                  name="Notes Created"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {tagFrequency.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Top Tags by Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tagFrequency.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))"
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--chart-2))"
                    name="Count"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
