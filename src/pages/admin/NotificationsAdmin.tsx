import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  RefreshCw,
  Mail,
  CheckCircle2,
  XCircle,
  Ban,
  Inbox,
  BellRing,
  BellOff,
  ChevronDown,
  Shield,
  User as UserIcon,
  Clock,
} from "lucide-react";

type LogRow = {
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

type MemberRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  membership: string | null;
  status: string | null;
};

type PrefsRow = {
  user_id: string;
  signup_enabled: boolean;
  login_enabled: boolean;
  booking_enabled: boolean;
  cancellation_enabled: boolean;
  login_balance_notification: boolean;
};

type ProfileRow = { id: string; email: string | null; name: string | null };

const RANGES = [
  { id: "24h", label: "24h", hours: 24 },
  { id: "7d", label: "7 days", hours: 24 * 7 },
  { id: "30d", label: "30 days", hours: 24 * 30 },
  { id: "90d", label: "90 days", hours: 24 * 90 },
];

const ADMIN_EMAILS = new Set(["admin@gym.com", "trainer@gym.com"]);

const statusBadge = (s: string) => {
  if (s === "sent" || s === "delivered") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "failed" || s === "dlq" || s === "bounced") return "bg-red-50 text-red-700 border-red-200";
  if (s === "suppressed" || s === "complained") return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "pending") return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-muted text-foreground border-border";
};

const statusLabel = (s: string) => {
  if (s === "sent") return "delivered";
  if (s === "dlq") return "failed";
  return s;
};

const initials = (name: string | null | undefined, email: string) => {
  const s = (name || email || "?").trim();
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
};

export default function NotificationsAdmin() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [prefs, setPrefs] = useState<PrefsRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [lastEverByEmail, setLastEverByEmail] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const hours = RANGES.find((r) => r.id === range)?.hours ?? 168;
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const [logsRes, membersRes, prefsRes, profilesRes, lastEverRes] = await Promise.all([
      // Pull from email_send_log (true source of delivery status).
      // A single email writes multiple rows (pending → sent/failed/dlq/bounced/...).
      // We dedupe client-side by message_id, keeping the latest.
      supabase
        .from("email_send_log")
        .select("id,message_id,template_name,recipient_email,status,error_message,created_at,metadata")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(3000),
      supabase
        .from("members")
        .select("id,name,email,phone,membership,status")
        .is("deleted_at", null),
      supabase.from("notification_settings").select("*"),
      supabase.from("profiles").select("id,email,name"),
      // Absolute most recent email per recipient (any time, sent only) so
      // we can show "last email outside the selected range" hints.
      supabase
        .from("email_send_log")
        .select("recipient_email,created_at")
        .eq("status", "sent")
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

    if (logsRes.data) {
      const seen = new Set<string>();
      const deduped: LogRow[] = [];
      for (const r of logsRes.data as any[]) {
        const key = r.message_id || r.id;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push({
          id: r.id,
          notification_type: r.template_name,
          recipient_email: r.recipient_email,
          user_name: null,
          user_email: r.recipient_email,
          subject: r.template_name,
          status: r.status,
          error_message: r.error_message,
          created_at: r.created_at,
        });
      }
      setLogs(deduped);
    }
    if (membersRes.data) setMembers(membersRes.data as any);
    if (prefsRes.data) setPrefs(prefsRes.data as any);
    if (profilesRes.data) setProfiles(profilesRes.data as any);
    if (lastEverRes.data) {
      const m = new Map<string, string>();
      for (const r of lastEverRes.data as any[]) {
        const k = (r.recipient_email || "").toLowerCase();
        if (!k) continue;
        if (!m.has(k)) m.set(k, r.created_at); // first seen = newest (ordered desc)
      }
      setLastEverByEmail(m);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // email -> user_id (profiles)
  const emailToUserId = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => p.email && m.set(p.email.toLowerCase(), p.id));
    return m;
  }, [profiles]);

  const prefsByUserId = useMemo(() => {
    const m = new Map<string, PrefsRow>();
    prefs.forEach((p) => m.set(p.user_id, p));
    return m;
  }, [prefs]);

  // Build per-recipient grouping
  type CustomerCard = {
    email: string;
    name: string | null;
    isAdmin: boolean;
    member?: MemberRow;
    prefs?: PrefsRow;
    logs: LogRow[];
    stats: { total: number; sent: number; failed: number; suppressed: number };
    lastSentAt?: string;
  };

  const cards: CustomerCard[] = useMemo(() => {
    const map = new Map<string, CustomerCard>();

    // Seed with all members so we show prefs even without any sends yet
    members.forEach((mb) => {
      const email = mb.email?.toLowerCase();
      if (!email) return;
      const userId = emailToUserId.get(email);
      map.set(email, {
        email: mb.email,
        name: mb.name,
        isAdmin: false,
        member: mb,
        prefs: userId ? prefsByUserId.get(userId) : undefined,
        logs: [],
        stats: { total: 0, sent: 0, failed: 0, suppressed: 0 },
      });
    });

    // Add logs
    logs.forEach((l) => {
      const email = l.recipient_email?.toLowerCase();
      if (!email) return;
      let card = map.get(email);
      if (!card) {
        const isAdmin = ADMIN_EMAILS.has(email);
        const userId = emailToUserId.get(email);
        card = {
          email: l.recipient_email,
          name: l.user_name || null,
          isAdmin,
          prefs: userId ? prefsByUserId.get(userId) : undefined,
          logs: [],
          stats: { total: 0, sent: 0, failed: 0, suppressed: 0 },
        };
        map.set(email, card);
      }
      card.logs.push(l);
      card.stats.total += 1;
      if (l.status === "sent") {
        card.stats.sent += 1;
        if (!card.lastSentAt || l.created_at > card.lastSentAt) card.lastSentAt = l.created_at;
      } else if (l.status === "failed" || l.status === "dlq" || l.status === "bounced") {
        card.stats.failed += 1;
      } else if (l.status === "suppressed" || l.status === "complained") {
        card.stats.suppressed += 1;
      }
    });

    // Mark admin emails
    map.forEach((c) => {
      if (ADMIN_EMAILS.has(c.email.toLowerCase())) c.isAdmin = true;
    });

    return Array.from(map.values());
  }, [logs, members, emailToUserId, prefsByUserId]);

  const filteredCards = useMemo(() => {
    return cards
      .filter((c) => {
        if (statusFilter === "with-activity" && c.stats.total === 0) return false;
        if (statusFilter === "with-failures" && c.stats.failed === 0) return false;
        if (statusFilter === "notifications-off") {
          const p = c.prefs;
          if (!p) return false;
          const allOn =
            p.signup_enabled &&
            p.login_enabled &&
            p.booking_enabled &&
            p.cancellation_enabled &&
            p.login_balance_notification;
          if (allOn) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          if (
            !c.email.toLowerCase().includes(q) &&
            !(c.name || "").toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Admins first, then by last activity desc, then by name
        if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
        const at = a.lastSentAt || a.logs[0]?.created_at || "";
        const bt = b.lastSentAt || b.logs[0]?.created_at || "";
        if (at && bt && at !== bt) return bt.localeCompare(at);
        return (a.name || a.email).localeCompare(b.name || b.email);
      });
  }, [cards, statusFilter, search]);

  const stats = useMemo(() => {
    let total = 0,
      sent = 0,
      failed = 0,
      suppressed = 0;
    logs.forEach((l) => {
      total++;
      if (l.status === "sent") sent++;
      else if (l.status === "failed" || l.status === "dlq" || l.status === "bounced") failed++;
      else if (l.status === "suppressed" || l.status === "complained") suppressed++;
    });
    return { total, sent, failed, suppressed };
  }, [logs]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </span>
                Email Activity
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track every email sent to admins and members, and view each
                recipient's notification preferences.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
              className="self-start sm:self-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard icon={<Inbox className="h-5 w-5" />} label="Total emails" value={stats.total} tone="neutral" />
            <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Delivered" value={stats.sent} tone="green" />
            <StatCard icon={<XCircle className="h-5 w-5" />} label="Failed" value={stats.failed} tone="red" />
            <StatCard icon={<Ban className="h-5 w-5" />} label="Suppressed" value={stats.suppressed} tone="amber" />
          </div>

          {/* Filters */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">
                  Range
                </span>
                {RANGES.map((r) => (
                  <Button
                    key={r.id}
                    variant={range === r.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRange(r.id)}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All recipients</SelectItem>
                    <SelectItem value="with-activity">With email activity</SelectItem>
                    <SelectItem value="with-failures">With failures</SelectItem>
                    <SelectItem value="notifications-off">Notifications partially off</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="h-10 sm:col-span-2"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cards grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCards.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-muted-foreground">
                No recipients match your filters.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
              {filteredCards.map((c) => (
                <CustomerEmailCard
                  key={c.email}
                  card={c}
                  lastEverAt={lastEverByEmail.get(c.email.toLowerCase())}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CustomerEmailCard({
  card,
  lastEverAt,
}: {
  card: {
    email: string;
    name: string | null;
    isAdmin: boolean;
    member?: MemberRow;
    prefs?: PrefsRow;
    logs: LogRow[];
    stats: { total: number; sent: number; failed: number; suppressed: number };
    lastSentAt?: string;
  };
  lastEverAt?: string;
}) {
  const [open, setOpen] = useState(false);
  const p = card.prefs;
  const allPrefs = p
    ? [
        { key: "signup", label: "Sign up", on: p.signup_enabled },
        { key: "login", label: "Login", on: p.login_enabled },
        { key: "booking", label: "Booking", on: p.booking_enabled },
        { key: "cancellation", label: "Cancellation", on: p.cancellation_enabled },
        { key: "balance", label: "Low balance", on: p.login_balance_notification },
      ]
    : [];
  const enabledCount = allPrefs.filter((x) => x.on).length;
  const prefsKnown = !!p;
  const allOn = prefsKnown && enabledCount === allPrefs.length;
  const allOff = prefsKnown && enabledCount === 0;

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow bg-card">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center font-semibold text-sm ring-1 ring-border/60 ${
              card.isAdmin
                ? "bg-amber-50 text-amber-700"
                : "bg-primary/10 text-primary"
            }`}
          >
            {initials(card.name, card.email)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base truncate">
                {card.name || card.email}
              </CardTitle>
              {card.isAdmin ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                  <Shield className="h-3 w-3 mr-1" /> Admin
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  <UserIcon className="h-3 w-3 mr-1" /> Member
                </Badge>
              )}
            </div>
            <CardDescription className="truncate">{card.email}</CardDescription>
            {card.member?.membership &&
              !["null", "none", ""].includes(card.member.membership.trim().toLowerCase()) && (
                <div className="mt-1 text-xs text-muted-foreground capitalize">
                  {card.member.membership} membership
                </div>
              )}
          </div>
          <div className="text-right shrink-0">
            {prefsKnown ? (
              allOn ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <BellRing className="h-3 w-3 mr-1" /> All on
                </Badge>
              ) : allOff ? (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <BellOff className="h-3 w-3 mr-1" /> All off
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <BellRing className="h-3 w-3 mr-1" /> {enabledCount}/{allPrefs.length}
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <BellOff className="h-3 w-3 mr-1" /> No prefs
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Email stats */}
        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="Total" value={card.stats.total} />
          <MiniStat label="Sent" value={card.stats.sent} tone="green" />
          <MiniStat label="Failed" value={card.stats.failed} tone="red" />
          <MiniStat label="Suppr." value={card.stats.suppressed} tone="amber" />
        </div>

        {/* Preferences */}
        {prefsKnown && (
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Email notifications
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allPrefs.map((pref) => (
                <span
                  key={pref.key}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border ${
                    pref.on
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-muted text-muted-foreground border-border line-through"
                  }`}
                >
                  {pref.on ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {pref.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Last activity / recent emails */}
        <div className="border-t border-border/60 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Recent emails
            </div>
            {(card.lastSentAt || card.logs[0]) && (
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {card.lastSentAt
                  ? `Last sent ${new Date(card.lastSentAt).toLocaleString()}`
                  : `Last ${new Date(card.logs[0].created_at).toLocaleString()}`}
              </div>
            )}
          </div>

          {card.logs.length === 0 ? (
            <div className="text-xs text-muted-foreground italic space-y-1">
              <div>No emails sent to this customer in the selected range.</div>
              {lastEverAt && (
                <div className="not-italic text-muted-foreground/80">
                  Last email ever sent: {new Date(lastEverAt).toLocaleString()} — widen the range to see it.
                </div>
              )}
            </div>
          ) : (
            <Collapsible open={open} onOpenChange={setOpen}>
              <ul className="space-y-1.5">
                {card.logs.slice(0, 3).map((l) => (
                  <LogLine key={l.id} log={l} />
                ))}
              </ul>
              {card.logs.length > 3 && (
                <>
                  <CollapsibleContent>
                    <ul className="space-y-1.5 mt-1.5">
                      {card.logs.slice(3).map((l) => (
                        <LogLine key={l.id} log={l} />
                      ))}
                    </ul>
                  </CollapsibleContent>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs w-full">
                      <ChevronDown
                        className={`h-3 w-3 mr-1 transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                      {open ? "Show less" : `Show ${card.logs.length - 3} more`}
                    </Button>
                  </CollapsibleTrigger>
                </>
              )}
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LogLine({ log }: { log: LogRow }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Badge variant="outline" className={`${statusBadge(log.status)} text-[10px] mt-0.5 shrink-0`}>
        {statusLabel(log.status)}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{log.subject || log.notification_type}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
          <span className="font-mono truncate">{log.notification_type}</span>
          <span>•</span>
          <span className="whitespace-nowrap">
            {new Date(log.created_at).toLocaleString()}
          </span>
        </div>
        {log.error_message && (
          <div className="text-[11px] text-red-600 truncate" title={log.error_message}>
            {log.error_message}
          </div>
        )}
      </div>
    </li>
  );
}

function MiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "green" | "red" | "amber";
}) {
  const toneCls =
    tone === "green"
      ? "text-emerald-700"
      : tone === "red"
      ? "text-red-700"
      : tone === "amber"
      ? "text-amber-700"
      : "text-foreground";
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-center">
      <div className={`text-base font-semibold leading-tight ${toneCls}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "neutral" | "green" | "red" | "amber";
}) {
  const ring =
    tone === "green"
      ? "ring-emerald-100"
      : tone === "red"
      ? "ring-red-100"
      : tone === "amber"
      ? "ring-amber-100"
      : "ring-border";
  const iconBg =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "red"
      ? "bg-red-50 text-red-700"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-muted text-foreground";
  return (
    <Card className={`border-border/60 shadow-sm ring-1 ${ring}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="text-2xl font-semibold mt-1">{value}</div>
          </div>
          <div className={`p-2.5 rounded-lg ${iconBg}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

