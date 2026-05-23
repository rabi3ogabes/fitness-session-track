import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Mail, CheckCircle2, XCircle, Ban, Inbox } from "lucide-react";

type Row = {
  id: string;
  notification_type: string;
  recipient_email: string;
  user_name: string | null;
  user_email: string | null;
  subject: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

const RANGES = [
  { id: "24h", label: "Last 24h", hours: 24 },
  { id: "7d", label: "Last 7 days", hours: 24 * 7 },
  { id: "30d", label: "Last 30 days", hours: 24 * 30 },
];

const PAGE_SIZE = 50;

const statusColor = (s: string) => {
  if (s === "sent") return "bg-green-100 text-green-800 border-green-200";
  if (s === "failed") return "bg-red-100 text-red-800 border-red-200";
  if (s === "suppressed") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

export default function NotificationsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const load = async () => {
    setLoading(true);
    const hours = RANGES.find(r => r.id === range)?.hours ?? 168;
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from("notification_logs")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (!error && data) setRows(data as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [range]);

  const types = useMemo(() => Array.from(new Set(rows.map(r => r.notification_type))).sort(), [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (typeFilter !== "all" && r.notification_type !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.recipient_email?.toLowerCase().includes(q) && !r.user_name?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [rows, typeFilter, statusFilter, search]);

  const stats = useMemo(() => ({
    total: filtered.length,
    sent: filtered.filter(r => r.status === "sent").length,
    failed: filtered.filter(r => r.status === "failed").length,
    suppressed: filtered.filter(r => r.status === "suppressed").length,
  }), [filtered]);

  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-64">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Mail className="h-6 w-6 text-primary shrink-0" /> Email Activity
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track every notification sent to admins and members.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="self-start sm:self-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard icon={<Inbox className="h-5 w-5" />} label="Total" value={stats.total} color="text-foreground" />
            <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Sent" value={stats.sent} color="text-green-600" />
            <StatCard icon={<XCircle className="h-5 w-5" />} label="Failed" value={stats.failed} color="text-red-600" />
            <StatCard icon={<Ban className="h-5 w-5" />} label="Suppressed" value={stats.suppressed} color="text-yellow-600" />
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {RANGES.map(r => (
                  <Button
                    key={r.id}
                    variant={range === r.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setRange(r.id); setPage(0); }}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Event type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All event types</SelectItem>
                    {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="suppressed">Suppressed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="h-10"
                  placeholder="Search recipient or name..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent notifications</CardTitle>
              <CardDescription>{filtered.length} entries</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : pageRows.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No notifications in this range.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.notification_type}</TableCell>
                          <TableCell>
                            <div className="text-sm">{r.recipient_email}</div>
                            {r.user_name && <div className="text-xs text-muted-foreground">{r.user_name}</div>}
                          </TableCell>
                          <TableCell className="text-sm">{r.subject}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
                            {r.error_message && (
                              <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={r.error_message}>{r.error_message}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(r.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
          </div>
          <div className={`p-2 rounded-md bg-muted ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
