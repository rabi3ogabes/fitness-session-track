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
