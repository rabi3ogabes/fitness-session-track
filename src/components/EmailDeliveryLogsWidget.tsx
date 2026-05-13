import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MailX, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface EmailStatusLog {
  id: string;
  webhook_type: string;
  webhook_url: string | null;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  response_body: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

const EmailDeliveryLogsWidget = () => {
  const [logs, setLogs] = useState<EmailStatusLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('webhook_delivery_logs')
      .select('*')
      .eq('webhook_type', 'email_status')
      .order('created_at', { ascending: false })
      .limit(20);
    setLogs((data ?? []) as EmailStatusLog[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('email_status_logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_delivery_logs',
          filter: "webhook_type=eq.email_status",
        },
        (payload) => {
          setLogs((prev) => [payload.new as EmailStatusLog, ...prev].slice(0, 20));
        }
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
            <Mail className="h-5 w-5" />
            Email Delivery Logs
          </CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No email status logs yet.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const payload = log.payload ?? {};
              const email = (payload.email as string) || '—';
              const type = (payload.type as string) || 'unknown';
              const isSuccess = log.success;

              return (
                <div
                  key={log.id}
                  className="rounded-md border bg-card p-3 text-sm space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {isSuccess ? (
                        <Mail className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <MailX className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <Badge variant={isSuccess ? 'default' : 'destructive'}>
                        {isSuccess ? 'Success' : 'Failed'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">Email:</span>{' '}
                    {email}
                  </div>

                  {log.status_code !== null && (
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">HTTP:</span>{' '}
                      {log.status_code}
                    </div>
                  )}

                  {log.error_message && (
                    <div className="rounded bg-destructive/10 text-destructive p-2 text-xs break-words">
                      <span className="font-semibold">Error:</span>{' '}
                      {log.error_message}
                    </div>
                  )}

                  {log.response_body && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Raw Response
                      </summary>
                      <pre className="mt-1 rounded bg-muted p-2 overflow-x-auto text-[11px]">
                        {log.response_body}
                      </pre>
                    </details>
                  )}

                  {log.payload && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Raw Payload
                      </summary>
                      <pre className="mt-1 rounded bg-muted p-2 overflow-x-auto text-[11px]">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </details>
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

export default EmailDeliveryLogsWidget;
