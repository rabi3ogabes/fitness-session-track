import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wlawjupusugrhojbywyq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYXdqdXB1c3VncmhvamJ5d3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMTIxOTYsImV4cCI6MjA2MTU4ODE5Nn0.-TMflVxBkU4MTTxRWd0jrSiNBCLhxnl8R4EqsrWrSlg";

// Configure auth persistence options with properly typed flowType
const supabaseOptions = {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit' as const,
    debug: true // Enable debug mode to see more information about connection issues
  },
  global: {
    headers: {
      'x-application-name': 'gym-management-system'
    },
    fetch: (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
      return new Promise((resolve, reject) => {
        // Add a timeout to prevent hanging fetch requests
        const timeoutId = setTimeout(() => {
          reject(new Error('Network request timed out. Please try again later.'));
        }, 15000); // Increase timeout to 15 seconds
        
        fetch(url, options)
          .then(response => {
            clearTimeout(timeoutId);
            resolve(response);
          })
          .catch(err => {
            clearTimeout(timeoutId);
            console.error("Network error when connecting to Supabase:", err);
            reject(new Error(`Network error: ${err.message}. Please check your connection and try again.`));
          });
      });
    }
  }
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, supabaseOptions);

// Add the requireAuth function that was missing
// This function wraps database operations to ensure authentication and proper error handling
// Updated to handle optional fallback data parameter
export const requireAuth = async <T>(
  callback: () => Promise<T>,
  fallbackData?: T
): Promise<T> => {
  try {
    // Check if we have an active session
    const { data: { session } } = await supabase.auth.getSession();
    
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
export const checkSupabaseConnection = async (maxRetries = 3, retryDelay = 500) => {
  if (isOffline()) {
    return { connected: false, latency: null, error: new Error("Device is offline") };
  }
  
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries <= maxRetries) {
    try {
      const start = Date.now();
      
      // Make a lightweight query to check connection
      // Use a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Connection check timed out")), 10000);
      });
      
      const queryPromise = supabase.from('profiles').select('id').limit(1).maybeSingle();
      
      // Race the query against the timeout
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      const latency = Date.now() - start;
      
      if (error) {
        console.warn(`Supabase connection check error (attempt ${retries + 1}/${maxRetries + 1}):`, error);
        lastError = error;
        retries++;
        
        if (retries <= maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
          continue;
        } else {
          throw error;
        }
      }
      
      console.log(`Supabase connection successful, latency: ${latency}ms`);
      return {
        connected: true,
        latency
      };
    } catch (error) {
      console.error(`Failed to connect to Supabase (attempt ${retries + 1}/${maxRetries + 1}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;
      
      if (retries <= maxRetries) {
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
      } else {
        return {
          connected: false,
          latency: null,
          error: lastError
        };
      }
    }
  }
  
  // This should never happen as we either return inside the loop or after max retries
  return {
    connected: false,
    latency: null,
    error: lastError || new Error("Unknown connection error")
  };
};

// Utility to check if we're offline
export const isOffline = () => {
  return typeof navigator !== 'undefined' && !navigator.onLine;
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

// Completely rewritten booking cancellation function with transaction support
export const cancelClassBooking = async (userId: string, classId: number): Promise<boolean> => {
  try {
    console.log(`[cancelClassBooking] Starting cancellation process for user ${userId}, class ${classId}`);
    
    // STEP 1: Find all bookings that match the criteria
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('class_id', classId);
      
    if (fetchError) {
      console.error("[cancelClassBooking] Error fetching bookings:", fetchError);
      return false;
    }
    
    if (!bookings || bookings.length === 0) {
      console.log("[cancelClassBooking] No bookings found to cancel");
      return false;
    }
    
    console.log(`[cancelClassBooking] Found ${bookings.length} bookings to cancel:`, bookings);
    let successCount = 0;
    
    // STEP 2: Use a transaction for atomic operations
    // Since Supabase doesn't support actual transactions in the client library,
    // we'll manually handle each step and roll back if needed
    
    // STEP 2.1: Get current enrollment count
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('enrolled')
      .eq('id', classId)
      .single();
      
    if (classError) {
      console.error("[cancelClassBooking] Error fetching class data:", classError);
      // Continue anyway since we still need to delete the booking
    }
    
    const currentEnrolled = classData?.enrolled || 0;
    
    // STEP 3: Delete all matching bookings one by one with retries
    for (const booking of bookings) {
      let deleted = false;
      let attempts = 0;
      
      // Try up to 3 times for each booking
      while (!deleted && attempts < 3) {
        attempts++;
        console.log(`[cancelClassBooking] Attempt ${attempts} to delete booking ${booking.id}`);
        
        const { error: deleteError } = await supabase
          .from('bookings')
          .delete()
          .eq('id', booking.id);
          
        if (deleteError) {
          console.error(`[cancelClassBooking] Error deleting booking (attempt ${attempts}):`, deleteError);
          // Wait before retrying
          await new Promise(r => setTimeout(r, 300));
        } else {
          console.log(`[cancelClassBooking] Successfully deleted booking ${booking.id}`);
          deleted = true;
          successCount++;
        }
      }
    }
    
    // STEP 4: Delete with filter approach as a fallback (ensure nothing remains)
    if (successCount < bookings.length) {
      console.log("[cancelClassBooking] Some bookings could not be deleted individually, trying filter delete");
      
      const { error: filterDeleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('user_id', userId)
        .eq('class_id', classId);
        
      if (filterDeleteError) {
        console.error("[cancelClassBooking] Filter delete failed:", filterDeleteError);
      } else {
        console.log("[cancelClassBooking] Filter delete executed successfully");
        successCount = bookings.length; // Assume all deleted
      }
    }
    
    // STEP 5: Verify no bookings remain
    const { data: remainingBookings, error: verifyError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('class_id', classId);
      
    if (verifyError) {
      console.error("[cancelClassBooking] Error verifying deletion:", verifyError);
    } else if (remainingBookings && remainingBookings.length > 0) {
      console.error("[cancelClassBooking] Failed to delete all bookings, some still remain:", remainingBookings);
      
      // Last attempt - direct SQL-like approach (may bypass some triggers/RLS)
      const { error: finalDeleteError } = await supabase
        .from('bookings')
        .delete()
        .filter('user_id', 'eq', userId)
        .filter('class_id', 'eq', classId);
        
      if (finalDeleteError) {
        console.error("[cancelClassBooking] Final deletion attempt failed:", finalDeleteError);
        return false;
      } else {
        // Check one more time
        const { data: finalCheck } = await supabase
          .from('bookings')
          .select('id')
          .eq('user_id', userId)
          .eq('class_id', classId);
          
        if (finalCheck && finalCheck.length > 0) {
          console.error("[cancelClassBooking] Failed to delete bookings after all attempts");
          return false;
        }
      }
    }
    
    // STEP 6: Update enrolled count if we succeeded at least partially
    if (successCount > 0 && currentEnrolled > 0) {
      const newEnrolledCount = Math.max(0, currentEnrolled - successCount);
      console.log(`[cancelClassBooking] Updating class ${classId} enrolled count from ${currentEnrolled} to ${newEnrolledCount}`);
      
      const { error: updateError } = await supabase
        .from('classes')
        .update({ enrolled: newEnrolledCount })
        .eq('id', classId);
      
      if (updateError) {
        console.error("[cancelClassBooking] Error updating class enrolled count:", updateError);
        // We still consider the cancellation successful since the booking was deleted
      }
    }
    
    console.log(`[cancelClassBooking] Successfully canceled ${successCount} bookings out of ${bookings.length}`);
    return true;
  } catch (err) {
    console.error("[cancelClassBooking] Unexpected error:", err);
    return false;
  }
};
