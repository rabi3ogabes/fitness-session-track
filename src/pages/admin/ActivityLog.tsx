import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ActivityLogRow {
  id: string;
  visitor_id: string | null;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  event_type: string;
  path: string | null;
  details: any;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
}

const EVENT_TYPES = [
  "all",
  "page_view",
  "ui_click",
  "signup",
  "signup_failed",
  "login",
  "login_failed",
  "logout",
  "booking_created",
  "booking_cancelled",
  "session_request",
  "profile_updated",
];

const eventColor = (t: string) => {
  if (t.includes("failed")) return "destructive";
  if (t === "signup" || t === "login") return "default";
  if (t === "logout") return "secondary";
  if (t.startsWith("booking")) return "default";
  return "outline";
};

const ActivityLog = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(200);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (eventType !== "all") q = q.eq("event_type", eventType);
    const { data, error } = await q;
    if (error) {
      toast({ title: "Failed to load activity", description: error.message, variant: "destructive" });
    } else {
      setRows((data as ActivityLogRow[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("activity_logs_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, limit]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.user_email, r.user_name, r.visitor_id, r.path, r.event_type, JSON.stringify(r.details)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [rows, search]);

  const clearAll = async () => {
    if (!confirm("Delete ALL activity logs? This cannot be undone.")) return;
    const { error } = await supabase
      .from("activity_logs")
      .delete()
      .gte("created_at", "1900-01-01");
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Activity logs cleared" });
      load();
    }
  };

  const stats = useMemo(() => {
    const uniqueVisitors = new Set(rows.map((r) => r.visitor_id).filter(Boolean)).size;
    const uniqueUsers = new Set(rows.map((r) => r.user_id).filter(Boolean)).size;
    const pageViews = rows.filter((r) => r.event_type === "page_view").length;
    const signups = rows.filter((r) => r.event_type === "signup").length;
    return { uniqueVisitors, uniqueUsers, pageViews, signups };
  }, [rows]);

  return (
    <DashboardLayout title="Activity Log">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Activity Log</h1>
            <p className="text-sm text-muted-foreground">
              Every page view and key action by visitors and members. Auto-deletes after 30 days.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Unique visitors</div><div className="text-2xl font-bold">{stats.uniqueVisitors}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Logged-in users</div><div className="text-2xl font-bold">{stats.uniqueUsers}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Page views</div><div className="text-2xl font-bold">{stats.pageViews}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Signups</div><div className="text-2xl font-bold">{stats.signups}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by email, name, path, visitor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="100">Last 100</SelectItem>
                <SelectItem value="200">Last 200</SelectItem>
                <SelectItem value="500">Last 500</SelectItem>
                <SelectItem value="1000">Last 1000</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Events {filtered.length > 0 && <span className="text-muted-foreground font-normal">({filtered.length})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No activity yet.</div>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {filtered.map((r) => (
                  <div key={r.id} className="border rounded-md p-3 hover:bg-muted/40 transition">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={eventColor(r.event_type) as any}>{r.event_type}</Badge>
                        {r.path && (
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">{r.path}</code>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "MMM d, yyyy HH:mm:ss")}
                      </span>
                    </div>
                    <div className="mt-2 text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                      <div>
                        <span className="text-muted-foreground">User: </span>
                        {r.user_email ? (
                          <span className="font-medium">{r.user_name || r.user_email} <span className="text-muted-foreground">({r.user_email})</span></span>
                        ) : (
                          <span className="italic text-muted-foreground">Guest</span>
                        )}
                      </div>
                      <div className="truncate">
                        <span className="text-muted-foreground">Visitor ID: </span>
                        <code className="text-xs">{r.visitor_id?.slice(0, 16) || "-"}</code>
                      </div>
                    </div>
                    {r.details && Object.keys(r.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">Details</summary>
                        <pre className="text-xs bg-muted/50 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(r.details, null, 2)}</pre>
                      </details>
                    )}
                    {r.user_agent && (
                      <div className="text-[10px] text-muted-foreground mt-1 truncate">{r.user_agent}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ActivityLog;
