import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * SessionKeeper
 *
 * Keeps the user signed in across long periods of inactivity on every device
 * (desktop, laptop, Android, iPhone, iPad, tablets).
 *
 * Strategy:
 * 1. Auth session is persisted in localStorage (see supabase/client.ts) so it
 *    survives tab close, browser restart, phone reboot, and app backgrounding.
 * 2. `autoRefreshToken` rotates the short-lived access token automatically
 *    while the tab is active.
 * 3. This component proactively calls `refreshSession()` whenever the app
 *    mounts, regains focus, or comes back from the background. That guarantees
 *    the refresh token is exercised every time the user opens the app, so the
 *    server-side inactivity window (≥ 60 days) only starts counting from the
 *    LAST time the user actually opened the app — not from initial login.
 *
 * Result: a user is only signed out if they do not open the app for ~2 months.
 */
const SessionKeeper = () => {
  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled || !data?.session) return;
        await supabase.auth.refreshSession();
      } catch {
        // Silent — refresh failure should never break the app.
      }
    };

    // Refresh on mount
    refresh();

    // Refresh whenever the tab/app becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    // Refresh on window focus (desktop) and pageshow (iOS Safari bfcache)
    const onFocus = () => refresh();
    const onPageShow = () => refresh();
    // Refresh when network comes back online (mobile data ↔ Wi-Fi switches)
    const onOnline = () => refresh();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", onOnline);

    // Also refresh periodically while the app is open (every 30 min)
    const interval = window.setInterval(refresh, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", onOnline);
      window.clearInterval(interval);
    };
  }, []);

  return null;
};

export default SessionKeeper;
