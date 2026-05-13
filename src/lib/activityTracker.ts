import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "fhb_visitor_id";

export const getVisitorId = (): string => {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `v_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return `v_${Date.now()}`;
  }
};

export type ActivityEventType =
  | "page_view"
  | "signup"
  | "signup_failed"
  | "login"
  | "login_failed"
  | "logout"
  | "booking_created"
  | "booking_cancelled"
  | "session_request"
  | "profile_updated";

interface LogOptions {
  path?: string;
  details?: Record<string, any>;
}

export const logActivity = async (
  eventType: ActivityEventType,
  options: LogOptions = {}
) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    const payload = {
      visitor_id: getVisitorId(),
      user_id: user?.id ?? null,
      user_email: user?.email ?? options.details?.email ?? null,
      user_name:
        (user?.user_metadata as any)?.name ??
        options.details?.name ??
        null,
      event_type: eventType,
      path: options.path ?? (typeof window !== "undefined" ? window.location.pathname : null),
      details: options.details ?? {},
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    };

    await supabase.from("activity_logs").insert(payload);
  } catch (err) {
    // Never let tracking break the app
    console.warn("activity log failed", err);
  }
};
