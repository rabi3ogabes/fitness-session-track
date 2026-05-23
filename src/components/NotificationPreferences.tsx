import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EVENTS = [
  { key: "signup_enabled" as const, label: "Sign up confirmation" },
  { key: "login_enabled" as const, label: "Login alerts" },
  { key: "booking_enabled" as const, label: "Class booking confirmation" },
  { key: "cancellation_enabled" as const, label: "Booking cancellation" },
];

type Prefs = Record<(typeof EVENTS)[number]["key"], boolean>;

interface Props { userId?: string }

const NotificationPreferences = ({ userId }: Props) => {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs>({
    signup_enabled: true,
    login_enabled: true,
    booking_enabled: true,
    cancellation_enabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("notification_settings")
        .select("signup_enabled, login_enabled, booking_enabled, cancellation_enabled")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setPrefs({
          signup_enabled: (data as any).signup_enabled ?? true,
          login_enabled: (data as any).login_enabled ?? true,
          booking_enabled: (data as any).booking_enabled ?? true,
          cancellation_enabled: (data as any).cancellation_enabled ?? true,
        });
      }
      setLoading(false);
    })();
  }, [userId]);

  const toggle = async (key: keyof Prefs, value: boolean) => {
    if (!userId) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const { error } = await supabase
      .from("notification_settings")
      .upsert({ user_id: userId, ...next }, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-xl font-bold mb-2">Notifications</h2>
      <p className="text-sm text-gray-500 mb-4">
        Choose which messages you want to receive. Admins always get notified.
      </p>
      <div className="space-y-3">
        {EVENTS.map((e) => (
          <div key={e.key} className="flex items-center justify-between">
            <Label htmlFor={e.key} className="text-sm">{e.label}</Label>
            <Switch
              id={e.key}
              checked={prefs[e.key]}
              disabled={loading || !userId}
              onCheckedChange={(v) => toggle(e.key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPreferences;
