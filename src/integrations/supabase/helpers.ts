// Shim helpers preserved during the backend migration to Lovable Cloud.
// These wrap supabase calls to keep the existing app code compiling.
import { supabase } from "./client";

export const isOffline = (): boolean =>
  typeof navigator !== "undefined" && navigator.onLine === false;

export type ConnectionStatus = {
  connected: boolean;
  latency: number;
};

export const checkSupabaseConnection = async (
  ..._args: unknown[]
): Promise<ConnectionStatus> => {
  const start = Date.now();
  try {
    const { error } = await supabase.from("admin_settings").select("id").limit(1);
    return { connected: !error, latency: Date.now() - start };
  } catch {
    return { connected: false, latency: Date.now() - start };
  }
};

export async function requireAuth<T>(): Promise<unknown>;
export async function requireAuth<T>(fn: () => Promise<T>, fallback?: T): Promise<T>;
export async function requireAuth<T>(fn?: () => Promise<T>, fallback?: T): Promise<T | unknown> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    if (fn !== undefined && fallback !== undefined) return fallback as T;
    throw new Error("Authentication required");
  }
  if (fn) {
    try {
      return await fn();
    } catch (err) {
      if (fallback !== undefined) return fallback as T;
      throw err;
    }
  }
  return data.session;
}

export const cacheDataForOffline = async <T>(_key: string, data: T): Promise<T> => {
  // Offline cache disabled after migration.
  return data;
};

export const cancelClassBooking = async (
  userIdOrBookingId: string,
  classId?: number
): Promise<boolean> => {
  const query = supabase.from("bookings").update({ status: "cancelled" });
  const { error } =
    classId !== undefined
      ? await query.eq("user_id", userIdOrBookingId).eq("class_id", classId)
      : await query.eq("id", userIdOrBookingId);
  if (error) {
    console.error("cancelClassBooking error:", error);
    return false;
  }
  return true;
};
