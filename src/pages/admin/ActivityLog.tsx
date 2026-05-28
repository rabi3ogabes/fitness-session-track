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
import { RefreshCw, Trash2, Search, ChevronDown, ChevronUp, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
      .channel(`activity_logs_realtime-${Math.random().toString(36).slice(2)}`)
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

        <UserActivityGrid rows={filtered} loading={loading} />
      </div>
    </DashboardLayout>
  );
};

interface UserGroup {
  key: string;
  label: string;
  email: string | null;
  isGuest: boolean;
  visitorId: string | null;
  events: ActivityLogRow[];
}

const UserActivityGrid = ({ rows, loading }: { rows: ActivityLogRow[]; loading: boolean }) => {
  const groups = useMemo<UserGroup[]>(() => {
    const map = new Map<string, UserGroup>();
    for (const r of rows) {
      const key = r.user_id || r.user_email || r.visitor_id || "unknown";
      const existing = map.get(key);
      if (existing) {
        existing.events.push(r);
      } else {
        map.set(key, {
          key,
          label: r.user_name || r.user_email || (r.visitor_id ? `Guest ${r.visitor_id.slice(0, 8)}` : "Unknown"),
          email: r.user_email,
          isGuest: !r.user_id,
          visitorId: r.visitor_id,
          events: [r],
        });
      }
    }
    // sort groups by most recent event
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.events[0].created_at).getTime() - new Date(a.events[0].created_at).getTime()
    );
  }, [rows]);

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Loading...</div>;
  }
  if (groups.length === 0) {
    return <div className="text-center py-10 text-muted-foreground">No activity yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {groups.map((g) => (
        <UserActivityCard key={g.key} group={g} />
      ))}
    </div>
  );
};

const UserActivityCard = ({ group }: { group: UserGroup }) => {
  const [open, setOpen] = useState(false);
  const [latest, ...previous] = group.events;

  return (
    <Card className="flex flex-col h-[360px]">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <UserIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm truncate">{group.label}</CardTitle>
            <div className="text-xs text-muted-foreground truncate">
              {group.email || (group.isGuest ? "Guest visitor" : "—")}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={group.isGuest ? "outline" : "secondary"} className="text-[10px]">
                {group.isGuest ? "Guest" : "Member"}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {group.events.length} event{group.events.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="p-4 bg-muted/30">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Most recent</div>
          <EventLine row={latest} highlight />
        </div>
        <Collapsible open={open} onOpenChange={setOpen} className="flex-1 flex flex-col min-h-0">
          <CollapsibleContent className="flex-1 overflow-y-auto px-4 py-2 space-y-2 border-t">
            {previous.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">No previous events.</div>
            ) : (
              previous.map((e) => <EventLine key={e.id} row={e} />)
            )}
          </CollapsibleContent>
          {previous.length > 0 && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-none border-t mt-auto">
                {open ? (
                  <><ChevronUp className="h-4 w-4 mr-1" /> Hide previous</>
                ) : (
                  <><ChevronDown className="h-4 w-4 mr-1" /> More ({previous.length})</>
                )}
              </Button>
            </CollapsibleTrigger>
          )}
        </Collapsible>
      </CardContent>
    </Card>
  );
};

const EventLine = ({ row, highlight = false }: { row: ActivityLogRow; highlight?: boolean }) => {
  return (
    <div className={highlight ? "" : "border-b last:border-b-0 pb-2 last:pb-0"}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant={eventColor(row.event_type) as any} className="text-[10px]">{row.event_type}</Badge>
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(row.created_at), "MMM d, HH:mm:ss")}
        </span>
      </div>
      {row.path && (
        <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded inline-block mt-1 truncate max-w-full">
          {row.path}
        </code>
      )}
      {row.details && Object.keys(row.details).length > 0 && (
        <details className="mt-1">
          <summary className="text-[10px] text-muted-foreground cursor-pointer">Details</summary>
          <pre className="text-[10px] bg-muted/50 p-1.5 rounded mt-1 overflow-x-auto">{JSON.stringify(row.details, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};

export default ActivityLog;
