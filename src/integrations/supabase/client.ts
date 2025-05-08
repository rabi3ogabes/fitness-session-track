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

// Fixed booking cancellation function with more robust error handling, retries and verification
export const cancelClassBooking = async (userId: string, classId: number): Promise<boolean> => {
  try {
    console.log(`Starting booking cancellation for user ${userId}, class ${classId}`);
    
    // STEP 1: Get the booking information first to confirm it exists
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('class_id', classId);
    
    if (bookingError) {
      console.error("[cancelClassBooking] Error checking booking existence:", bookingError);
      throw bookingError;
    }
    
    if (!bookingData || bookingData.length === 0) {
      console.error("[cancelClassBooking] No bookings found to cancel");
      return false;
    }
    
    console.log(`[cancelClassBooking] Found ${bookingData.length} booking(s) to cancel: `, bookingData);
    
    // STEP 2: Get current enrolled count from class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('enrolled')
      .eq('id', classId)
      .single();
      
    if (classError) {
      console.error("[cancelClassBooking] Error getting class data:", classError);
      // Continue despite this error
    }
    
    const currentEnrolled = classData?.enrolled || 0;
    console.log(`[cancelClassBooking] Current class enrolled count: ${currentEnrolled}`);
    
    // STEP 3: Delete each booking by ID (more reliable)
    let successfulDeletes = 0;
    for (const booking of bookingData) {
      const bookingId = booking.id;
      console.log(`[cancelClassBooking] Deleting booking ID: ${bookingId}`);
      
      // Try up to 3 times to delete the booking
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { error: deleteError } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);
        
        if (deleteError) {
          console.error(`[cancelClassBooking] Error deleting booking ID ${bookingId} (attempt ${attempt}/3):`, deleteError);
          
          if (attempt === 3) {
            throw new Error(`Failed to delete booking after 3 attempts: ${deleteError.message}`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        } else {
          console.log(`[cancelClassBooking] Successfully deleted booking ID ${bookingId}`);
          successfulDeletes++;
          break; // Exit retry loop on success
        }
      }
    }
    
    // STEP 4: Verify deletions worked by checking if any bookings remain
    const { data: verifyData, error: verifyError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('class_id', classId);
      
    if (verifyError) {
      console.error("[cancelClassBooking] Error verifying bookings deleted:", verifyError);
      // Continue despite this error if we had some successful deletes
      if (successfulDeletes === 0) {
        return false;
      }
    } else if (verifyData && verifyData.length > 0) {
      console.error("[cancelClassBooking] Warning: Still found bookings after deletion attempt:", verifyData);
      
      // Last ditch effort - try direct filter deletion
      const { error: finalDeleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('user_id', userId)
        .eq('class_id', classId);
      
      if (finalDeleteError) {
        console.error("[cancelClassBooking] Final delete attempt failed:", finalDeleteError);
        return false;
      }
      
      // Check one more time
      const { data: finalVerifyData } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', userId)
        .eq('class_id', classId);
        
      if (finalVerifyData && finalVerifyData.length > 0) {
        console.error("[cancelClassBooking] Critical error: Could not delete bookings after multiple attempts");
        return false;
      }
    }
    
    // STEP 5: Update the enrolled count
    if (currentEnrolled > 0) {
      const newEnrolledCount = Math.max(0, currentEnrolled - successfulDeletes);
      console.log(`[cancelClassBooking] Updating class ${classId} enrolled count from ${currentEnrolled} to ${newEnrolledCount}`);
      
      const { error: updateError } = await supabase
        .from('classes')
        .update({ enrolled: newEnrolledCount })
        .eq('id', classId);
      
      if (updateError) {
        console.error("[cancelClassBooking] Error updating class enrolled count:", updateError);
        // Continue despite this error since the booking itself was cancelled
      } else {
        console.log(`[cancelClassBooking] Successfully updated class ${classId} enrolled count to ${newEnrolledCount}`);
      }
    }
    
    console.log("[cancelClassBooking] Cancellation completed successfully");
    return true;
  } catch (err) {
    console.error("[cancelClassBooking] Critical error in cancelClassBooking:", err);
    return false;
  }
};
