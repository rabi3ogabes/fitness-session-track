import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Mail, Webhook, ShieldCheck, BellRing, UserRound, Send, Loader2 } from "lucide-react";

type Provider = "lovable_email" | "n8n";

type Settings = {
  active_provider: Provider;
  notification_email: string;
  notification_cc_email: string | null;
  signup_notifications: boolean;
  login_notifications: boolean;
  booking_notifications: boolean;
  cancellation_notifications: boolean;
  session_request_notifications: boolean;
  notify_member_welcome: boolean;
  notify_member_booking: boolean;
  notify_member_cancellation: boolean;
  notify_member_session_request: boolean;
  n8n_webhook_url: string | null;
  n8n_signup_webhook_url: string | null;
  n8n_booking_webhook_url: string | null;
  n8n_cancellation_webhook_url: string | null;
  n8n_session_request_webhook_url: string | null;
};

const defaults: Settings = {
  active_provider: "lovable_email",
  notification_email: "",
  notification_cc_email: "",
  signup_notifications: true,
  login_notifications: true,
  booking_notifications: true,
  cancellation_notifications: true,
  session_request_notifications: true,
  notify_member_welcome: true,
  notify_member_booking: true,
  notify_member_cancellation: true,
  notify_member_session_request: true,
  n8n_webhook_url: "",
  n8n_signup_webhook_url: "",
  n8n_booking_webhook_url: "",
  n8n_cancellation_webhook_url: "",
  n8n_session_request_webhook_url: "",
};

const ADMIN_EVENTS: { key: keyof Settings; label: string; desc: string }[] = [
  { key: "signup_notifications", label: "New signups", desc: "Get notified when members register" },
  { key: "login_notifications", label: "Member logins", desc: "Sign-in activity alerts" },
  { key: "booking_notifications", label: "Class bookings", desc: "When a member books a class" },
  { key: "cancellation_notifications", label: "Cancellations", desc: "When a member cancels a booking" },
  { key: "session_request_notifications", label: "Session requests", desc: "When a member requests sessions" },
];

const MEMBER_EVENTS: { key: keyof Settings; label: string; desc: string }[] = [
  { key: "notify_member_welcome", label: "Welcome email", desc: "Send a welcome email after signup" },
  { key: "notify_member_booking", label: "Booking confirmation", desc: "Confirm bookings to the member" },
  { key: "notify_member_cancellation", label: "Cancellation confirmation", desc: "Confirm cancellations" },
  { key: "notify_member_session_request", label: "Session request received", desc: "Acknowledge their request" },
];

export default function NotificationsTab() {
  const [s, setS] = useState<Settings>(defaults);
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("admin_notification_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setId(data.id);
        setS({ ...defaults, ...data, active_provider: (data as any).active_provider || "lovable_email" });
      }
      setLoading(false);
    })();
  }, []);

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) => setS(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...s, notification_cc_email: s.notification_cc_email || null };
      const { error } = id
        ? await supabase.from("admin_notification_settings").update(payload).eq("id", id)
        : await supabase.from("admin_notification_settings").insert(payload).select().single();
      if (error) throw error;
      toast({ title: "Saved", description: "Notification settings updated." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const sendTest = async () => {
    const recipient = testEmail || s.notification_email;
    if (!recipient) {
      toast({ title: "No recipient", description: "Set a notification email or test email.", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-admin-notification", {
        body: {
          type: "signup",
          userEmail: recipient,
          userName: "Test User",
          details: "This is a test notification from your admin settings.",
        },
      });
      if (error) throw error;
      toast({ title: "Test sent", description: `Provider: ${(data as any)?.provider || s.active_provider}` });
    } catch (e: any) {
      toast({ title: "Test failed", description: e.message, variant: "destructive" });
    } finally { setTesting(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Provider selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Notification provider</CardTitle>
          <CardDescription>Choose how the system delivers notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ProviderCard
              active={s.active_provider === "lovable_email"}
              onClick={() => update("active_provider", "lovable_email")}
              icon={<Mail className="h-5 w-5" />}
              title="Lovable Email"
              subtitle="Built-in branded emails with full tracking"
              badge="Recommended"
            />
            <ProviderCard
              active={s.active_provider === "n8n"}
              onClick={() => update("active_provider", "n8n")}
              icon={<Webhook className="h-5 w-5" />}
              title="n8n Webhooks"
              subtitle="Route every event to your n8n workflow"
            />
          </div>
        </CardContent>
      </Card>

      {/* Provider configuration */}
      {s.active_provider === "lovable_email" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Sender configuration</CardTitle>
                <CardDescription>Emails are delivered from your verified domain.</CardDescription>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-700">notify.fhbfit.com · verified</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admin-email">Admin notification email</Label>
                <Input id="admin-email" type="email" placeholder="admin@fhbfit.com"
                  value={s.notification_email} onChange={e => update("notification_email", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cc-email">CC (optional)</Label>
                <Input id="cc-email" type="email" placeholder="ops@fhbfit.com"
                  value={s.notification_cc_email || ""} onChange={e => update("notification_cc_email", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5 text-primary" /> n8n webhook URLs</CardTitle>
            <CardDescription>Leave a per-event URL empty to fall back to the default webhook.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Default webhook</Label>
              <Input placeholder="https://n8n.example.com/webhook/notify"
                value={s.n8n_webhook_url || ""} onChange={e => update("n8n_webhook_url", e.target.value)} />
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Signup webhook</Label><Input value={s.n8n_signup_webhook_url || ""} onChange={e => update("n8n_signup_webhook_url", e.target.value)} /></div>
              <div><Label>Booking webhook</Label><Input value={s.n8n_booking_webhook_url || ""} onChange={e => update("n8n_booking_webhook_url", e.target.value)} /></div>
              <div><Label>Cancellation webhook</Label><Input value={s.n8n_cancellation_webhook_url || ""} onChange={e => update("n8n_cancellation_webhook_url", e.target.value)} /></div>
              <div><Label>Session request webhook</Label><Input value={s.n8n_session_request_webhook_url || ""} onChange={e => update("n8n_session_request_webhook_url", e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 text-primary" /> Admin alerts</CardTitle>
            <CardDescription>Events that notify the admin team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ADMIN_EVENTS.map(ev => (
              <ToggleRow key={ev.key} label={ev.label} desc={ev.desc}
                checked={!!s[ev.key]} onChange={(v) => update(ev.key, v as any)} />
            ))}
          </CardContent>
        </Card>

        <Card className={s.active_provider === "n8n" ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" /> Member emails</CardTitle>
            <CardDescription>
              {s.active_provider === "n8n"
                ? "Member emails are only sent via Lovable Email. Switch provider to enable."
                : "Emails sent directly to your members."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MEMBER_EVENTS.map(ev => (
              <ToggleRow key={ev.key} label={ev.label} desc={ev.desc}
                checked={!!s[ev.key]} disabled={s.active_provider === "n8n"}
                onChange={(v) => update(ev.key, v as any)} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Test + save */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Send test notification</CardTitle>
          <CardDescription>Trigger a sample signup notification through the active provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder={s.notification_email || "test@example.com"}
              value={testEmail} onChange={e => setTestEmail(e.target.value)} className="flex-1" />
            <Button onClick={sendTest} disabled={testing} variant="outline">
              {testing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending</> : "Send test"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving</> : "Save settings"}
        </Button>
      </div>
    </div>
  );
}

function ProviderCard({ active, onClick, icon, title, subtitle, badge }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string; badge?: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`text-left rounded-lg border-2 p-4 transition-all ${active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/40"}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{icon}</div>
        {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
      </div>
      <div className="mt-3">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
    </button>
  );
}

function ToggleRow({ label, desc, checked, onChange, disabled }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex-1">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
