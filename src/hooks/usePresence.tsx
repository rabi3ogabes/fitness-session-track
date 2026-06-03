import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/**
 * Global presence tracking using Supabase Realtime presence.
 *
 * - Every authenticated user joins the shared `online-users-v1` channel and
 *   broadcasts their email/role while their app is open and visible.
 * - Any component can subscribe to the current set of online emails via
 *   the `useOnlineEmails` hook to render an online/offline indicator.
 */

const CHANNEL_NAME = "online-users-v1";

type PresenceMeta = { email: string; role: string; online_at: string };

// Module-level store so all subscribers share one channel
let channel: ReturnType<typeof supabase.channel> | null = null;
let refCount = 0;
let onlineEmails = new Set<string>();
const listeners = new Set<(s: Set<string>) => void>();

const notify = () => {
  const snap = new Set(onlineEmails);
  listeners.forEach((l) => l(snap));
};

const ensureChannel = () => {
  if (channel) return channel;
  channel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: "" } },
  });
  channel.on("presence", { event: "sync" }, () => {
    const state = channel!.presenceState() as Record<string, PresenceMeta[]>;
    const next = new Set<string>();
    Object.values(state).forEach((metas) => {
      metas.forEach((m) => {
        if (m?.email) next.add(m.email.toLowerCase());
      });
    });
    onlineEmails = next;
    notify();
  });
  channel.subscribe();
  return channel;
};

const teardownChannel = () => {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
    onlineEmails = new Set();
    notify();
  }
};

/** Mount once in App. Tracks the current user's presence. */
export const PresenceTracker = () => {
  const { user, isAdmin, isTrainer } = useAuth();

  useEffect(() => {
    if (!user?.email) return;
    const ch = ensureChannel();
    const role = isAdmin ? "admin" : isTrainer ? "trainer" : "member";

    const track = () => {
      ch.track({
        email: user.email!.toLowerCase(),
        role,
        online_at: new Date().toISOString(),
      } as PresenceMeta);
    };

    // Track once the channel is subscribed
    const sub = ch.subscribe((status) => {
      if (status === "SUBSCRIBED") track();
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") track();
      else ch.untrack();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", track);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", track);
      ch.untrack();
    };
  }, [user?.email, isAdmin, isTrainer]);

  return null;
};

/** Subscribe to the set of currently online emails (lowercased). */
export const useOnlineEmails = (): Set<string> => {
  const [emails, setEmails] = useState<Set<string>>(() => new Set(onlineEmails));

  useEffect(() => {
    ensureChannel();
    refCount += 1;
    const cb = (s: Set<string>) => setEmails(s);
    listeners.add(cb);
    // Initial snapshot in case channel already had state
    cb(onlineEmails);

    return () => {
      listeners.delete(cb);
      refCount -= 1;
      if (refCount <= 0 && listeners.size === 0) {
        teardownChannel();
      }
    };
  }, []);

  return emails;
};

/** Convenience: is a given email currently online? */
export const useIsOnline = (email?: string | null): boolean => {
  const set = useOnlineEmails();
  if (!email) return false;
  return set.has(email.toLowerCase());
};
