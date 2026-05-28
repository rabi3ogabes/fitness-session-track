import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Clock, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationLog {
  id: string;
  notification_type: string;
  user_email: string | null;
  user_name: string | null;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const statusVariant = (s: string) => {
  if (s === "sent") return "default";
  if (s === "failed") return "destructive";
  return "secondary"; // pending
};

const NotificationLogsWidget = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notification_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setLogs((data ?? []) as NotificationLog[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`notification_logs_widget-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_logs" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notification Logs
          </CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {logs.map((log) => {
              const sent = log.status === "sent";
              const failed = log.status === "failed";
              return (
                <div key={log.id} className="rounded-md border bg-card p-3 text-sm space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {sent ? (
                        <Bell className="h-4 w-4 text-green-600" />
                      ) : failed ? (
                        <BellOff className="h-4 w-4 text-destructive" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge variant={statusVariant(log.status) as any}>
                        {log.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.notification_type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">Subject:</span> {log.subject}
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">Sent to (admin):</span>{" "}
                    {log.recipient_email}
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">About member:</span>{" "}
                    {log.user_name || "—"}{" "}
                    {log.user_email ? `<${log.user_email}>` : ""}
                  </div>

                  {log.error_message && (
                    <div className="rounded bg-destructive/10 text-destructive p-2 text-xs break-words">
                      <span className="font-semibold">Error:</span> {log.error_message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationLogsWidget;
