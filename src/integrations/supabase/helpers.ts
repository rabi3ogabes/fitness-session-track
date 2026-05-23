// Shim helpers preserved during the backend migration to Lovable Cloud.
// These wrap supabase calls to keep the existing app code compiling.
import { supabase } from "./client";

export const isOffline = (): boolean =>
  typeof navigator !== "undefined" && navigator.onLine === false;

export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from("admin_settings").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
};

export const requireAuth = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error("Authentication required");
  }
  return data.session;
};

export const cacheDataForOffline = async <T>(_key: string, data: T): Promise<T> => {
  // Offline cache disabled after migration. Return data as-is.
  return data;
};

export const cancelClassBooking = async (bookingId: string) => {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
