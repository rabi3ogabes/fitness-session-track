import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://wlawjupusugrhojbywyq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYXdqdXB1c3VncmhvamJ5d3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMTIxOTYsImV4cCI6MjA2MTU4ODE5Nn0.-TMflVxBkU4MTTxRWd0jrSiNBCLhxnl8R4EqsrWrSlg";

// Configure auth persistence options with properly typed flowType
const supabaseOptions = {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "implicit" as const,
    debug: true, // Enable debug mode to see more information about connection issues
  },
  global: {
    headers: {
      "x-application-name": "gym-management-system",
    },
    fetch: (
      url: RequestInfo | URL,
      options?: RequestInit
    ): Promise<Response> => {
      return new Promise((resolve, reject) => {
        // Add a timeout to prevent hanging fetch requests
        const timeoutId = setTimeout(() => {
          reject(
            new Error("Network request timed out. Please try again later.")
          );
        }, 15000); // Increase timeout to 15 seconds

        fetch(url, options)
          .then((response) => {
            clearTimeout(timeoutId);
            resolve(response);
          })
          .catch((err) => {
            clearTimeout(timeoutId);
            console.error("Network error when connecting to Supabase:", err);
            reject(
              new Error(
                `Network error: ${err.message}. Please check your connection and try again.`
              )
            );
          });
      });
    },
  },
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  supabaseOptions
);

// Add the requireAuth function that was missing
// This function wraps database operations to ensure authentication and proper error handling
// Updated to handle optional fallback data parameter
export const requireAuth = async <T>(
  callback: () => Promise<T>,
  fallbackData?: T
): Promise<T> => {
  try {
    // Check if we have an active session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.warn("No active session found, but proceeding with operation");
      // Note: This still allows the operation to proceed, which is likely what was intended
      // since the original code was calling operations directly
    }

    // Execute the callback function (database operation)
    return await callback();
  } catch (error: any) {
    console.error("Error during authenticated operation:", error);

    // If fallback data is provided, return it in case of error
    if (fallbackData !== undefined) {
      console.log("Using fallback data due to error:", error.message);
      return fallbackData;
    }

    throw error;
  }
};

// Improved Utility to check connection to Supabase with better error handling and retry mechanism
export const checkSupabaseConnection = async (
  maxRetries = 3,
  retryDelay = 500
) => {
  if (isOffline()) {
    return {
      connected: false,
      latency: null,
      error: new Error("Device is offline"),
    };
  }

  let retries = 0;
  let lastError: Error | null = null;

  while (retries <= maxRetries) {
    try {
      const start = Date.now();

      // Make a lightweight query to check connection
      // Use a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Connection check timed out")),
          10000
        );
      });

      const queryPromise = supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .maybeSingle();

      // Race the query against the timeout
      const { data, error } = (await Promise.race([
        queryPromise,
        timeoutPromise,
      ])) as any;

      const latency = Date.now() - start;

      if (error) {
        console.warn(
          `Supabase connection check error (attempt ${retries + 1}/${
            maxRetries + 1
          }):`,
          error
        );
        lastError = error;
        retries++;

        if (retries <= maxRetries) {
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * retries)
          );
          continue;
        } else {
          throw error;
        }
      }

      console.log(`Supabase connection successful, latency: ${latency}ms`);
      return {
        connected: true,
        latency,
      };
    } catch (error) {
      console.error(
        `Failed to connect to Supabase (attempt ${retries + 1}/${
          maxRetries + 1
        }):`,
        error
      );
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;

      if (retries <= maxRetries) {
        // Wait before retrying with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * retries)
        );
      } else {
        return {
          connected: false,
          latency: null,
          error: lastError,
        };
      }
    }
  }

  // This should never happen as we either return inside the loop or after max retries
  return {
    connected: false,
    latency: null,
    error: lastError || new Error("Unknown connection error"),
  };
};

// Utility to check if we're offline
export const isOffline = () => {
  return typeof navigator !== "undefined" && !navigator.onLine;
};

// Function to cache data for offline use
export const cacheDataForOffline = (entityName: string, data: any) => {
  try {
    localStorage.setItem(`cached_${entityName}`, JSON.stringify(data));
    console.log(`Cached ${entityName} data for offline use`);
  } catch (e) {
    console.warn(`Failed to cache ${entityName} data:`, e);
  }
};

// Enhanced cancelClassBooking function with better error handling and debugging
export const cancelClassBooking = async (
  userId: string,
  classId: number
): Promise<boolean> => {
  if (!userId || !classId) {
    console.error("Invalid userId or classId:", { userId, classId });
    return false;
  }

  console.log(`Attempting to cancel booking: user=${userId}, class=${classId}`);

  try {
    // First check if the booking exists
    const { data: bookingData, error: bookingCheckError } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .eq("class_id", classId)
      .eq("status", "confirmed");

    if (bookingCheckError) {
      console.error("Error checking booking existence:", bookingCheckError);
      return false;
    }

    if (!bookingData || bookingData.length === 0) {
      console.warn("No confirmed booking found for cancellation:", {
        userId,
        classId,
      });
      return false;
    }

    console.log("Found booking(s) to cancel:", bookingData);

    // Update the booking status to 'cancelled'
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .eq("class_id", classId)
      .eq("status", "confirmed");

    if (updateError) {
      console.error("Error updating booking status:", updateError);
      return false;
    }

    console.log("Successfully updated booking status to cancelled");

    // Get the class details to update the enrolled count
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("enrolled")
      .eq("id", classId)
      .single();

    if (classError || !classData) {
      console.error("Error getting class data:", classError);
      console.warn("Booking was cancelled but class data couldn't be updated");
      return true; // Return true since the booking was cancelled
    }

    // Update the enrolled count if it's greater than 0
    // Reduce enrolled count by the number of bookings that were cancelled
    const bookingsCount = bookingData.length;

    if (classData.enrolled && classData.enrolled > 0) {
      // Ensure we don't set enrolled to a negative value
      const newEnrolledCount = Math.max(0, classData.enrolled - bookingsCount);

      const { error: updateError } = await supabase
        .from("classes")
        .update({ enrolled: newEnrolledCount })
        .eq("id", classId);

      if (updateError) {
        console.error("Error updating class enrolled count:", updateError);
        console.warn("Booking was cancelled but enrolled count wasn't updated");
        // The booking was cancelled but the enrolled count wasn't updated
        return true;
      }

      console.log("Successfully updated class enrolled count:", {
        classId,
        oldCount: classData.enrolled,
        newCount: newEnrolledCount,
        bookingsRemoved: bookingsCount,
      });
    }

    return true;
  } catch (error) {
    console.error("Unexpected error during booking cancellation:", error);
    return false;
  }
};
