import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WebhookLog {
  id: string;
  webhook_type: string;
  webhook_url: string | null;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  response_body: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  signup: 'Signup',
  booking: 'Booking',
  cancellation: 'Cancellation',
  session_request: 'Session Request',
};

export const WebhookHealth: React.FC = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestSignup, setLatestSignup] = useState<WebhookLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('webhook_delivery_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    const rows = (data ?? []) as WebhookLog[];
    setLogs(rows);
    setLatestSignup(rows.find((r) => r.webhook_type === 'signup') ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`webhook_delivery_logs_changes-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webhook_delivery_logs' },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const isInactiveError = (log: WebhookLog | null) =>
    !!log &&
    !log.success &&
    (log.status_code === 404 ||
      (log.error_message ?? '').toLowerCase().includes('not registered') ||
      (log.error_message ?? '').toLowerCase().includes('workflow must be active'));

  return (
    <div className="space-y-6">
      {latestSignup && !latestSignup.success && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>
            {isInactiveError(latestSignup)
              ? 'n8n signup workflow is INACTIVE or webhook is not registered'
              : 'Latest signup webhook delivery FAILED'}
          </AlertTitle>
          <AlertDescription className="space-y-1">
            <div>
              <strong>Status:</strong> {latestSignup.status_code ?? 'No response'}
            </div>
            <div>
              <strong>Error:</strong> {latestSignup.error_message ?? 'Unknown error'}
            </div>
            <div className="text-xs opacity-80">
              {formatDistanceToNow(new Date(latestSignup.created_at), { addSuffix: true })}
            </div>
            {isInactiveError(latestSignup) && (
              <div className="mt-2 text-sm">
                Open n8n → toggle the workflow <strong>Active</strong> (top-right of the editor),
                then trigger a new signup to retest.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhook Health</CardTitle>
              <CardDescription>
                Latest delivery status of n8n webhook calls (last 50 attempts)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {latestSignup && (
            <div className="mb-6 p-4 rounded-md border bg-muted/30">
              <div className="font-semibold mb-2">Last Signup Webhook Delivery</div>
              <div className="flex items-center gap-2 mb-1">
                {latestSignup.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <Badge variant={latestSignup.success ? 'default' : 'destructive'}>
                  {latestSignup.success ? 'Success' : 'Failed'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  HTTP {latestSignup.status_code ?? '—'} •{' '}
                  {formatDistanceToNow(new Date(latestSignup.created_at), { addSuffix: true })}
                </span>
              </div>
              {latestSignup.error_message && (
                <div className="text-sm text-destructive break-words">
                  {latestSignup.error_message}
                </div>
              )}
            </div>
          )}

          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No webhook deliveries logged yet.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-md border bg-card"
                >
                  {log.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {TYPE_LABELS[log.webhook_type] ?? log.webhook_type}
                      </Badge>
                      <Badge variant={log.success ? 'default' : 'destructive'}>
                        HTTP {log.status_code ?? '—'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {log.error_message && (
                      <div className="text-sm text-destructive mt-1 break-words">
                        {log.error_message}
                      </div>
                    )}
                    {log.webhook_url && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {log.webhook_url}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookHealth;
