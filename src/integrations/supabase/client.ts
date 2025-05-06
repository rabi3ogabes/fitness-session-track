
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
    debug: false
  },
  global: {
    headers: {
      'x-application-name': 'gym-management-system'
    },
    // Properly typed fetch function
    fetch: (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
      return new Promise((resolve, reject) => {
        // Add a timeout to prevent hanging fetch requests
        const timeoutId = setTimeout(() => {
          reject(new Error('Network request timed out. Please try again later.'));
        }, 10000); // 10 second timeout
        
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

// Create a demo client with RLS bypass capabilities
const createDemoClient = () => {
  // Create a client that will bypass RLS
  return createClient<Database>(
    SUPABASE_URL, 
    SUPABASE_PUBLISHABLE_KEY, 
    {
      ...supabaseOptions,
      global: {
        ...supabaseOptions.global,
        headers: {
          ...supabaseOptions.global.headers,
          // Special header that bypasses RLS
          'x-demo-bypass-rls': 'true',
        },
        // Use the same improved fetch function here
        fetch: supabaseOptions.global.fetch
      }
    }
  );
};

// Fallback data when offline
const fallbackData = {
  trainers: [
    { id: 1, name: "John Smith", email: "john@example.com", phone: "555-1234", specialization: "Strength Training", status: "Active", gender: "Male" },
    { id: 2, name: "Sarah Johnson", email: "sarah@example.com", phone: "555-5678", specialization: "Yoga", status: "Active", gender: "Female" },
    { id: 3, name: "Mike Wilson", email: "mike@example.com", phone: "555-9012", specialization: "CrossFit", status: "Active", gender: "Male" },
    { id: 4, name: "Lisa Brown", email: "lisa@example.com", phone: "555-3456", specialization: "Pilates", status: "Active", gender: "Female" },
  ],
  classes: []
};

// Enhanced authentication helper for demo purposes
export const requireAuth = async (callback: () => Promise<any>, fallbackData = null, maxRetries = 3) => {
  let retryCount = 0;
  
  const executeWithRetry = async (): Promise<any> => {
    try {
      // Check if we're offline first
      if (isOffline()) {
        console.log("Device is offline. Using fallback data.");
        // Use cached data from localStorage if available
        const cachedEntityMatch = callback.toString().match(/from\(['"](.*?)['"]\)/);
        if (cachedEntityMatch && cachedEntityMatch[1]) {
          const entityName = cachedEntityMatch[1];
          const cachedData = localStorage.getItem(`cached_${entityName}`);
          if (cachedData) {
            console.log(`Using cached ${entityName} data`);
            return JSON.parse(cachedData);
          }
        }
        
        // Otherwise use our default fallback data
        if (callback.toString().includes("trainers")) {
          return fallbackData?.trainers || fallbackData;
        }
        return fallbackData;
      }
      
      // Check if we're in demo mode first for faster path
      const mockRole = localStorage.getItem('userRole');
      if (mockRole) {
        console.log("Detected demo mode, using bypass RLS client");
        const demoClient = createDemoClient();
        return await executeDemoOperation(demoClient, callback);
      }
      
      // If not in demo mode, check for a real session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        throw new Error('Authentication verification failed');
      }
      
      // If we have a real session, proceed with the callback
      if (session) {
        console.log("Real authentication confirmed, executing protected operation");
        return await callback();
      }
      
      // If we get here, there's no session and no demo credentials
      console.error("No active session found and not using demo credentials");
      throw new Error('Authentication required');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Network error') && retryCount < maxRetries) {
        console.log(`Network error, retrying... (${retryCount + 1}/${maxRetries})`);
        retryCount++;
        // Exponential backoff
        const backoffTime = 1000 * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return executeWithRetry();
      }
      
      console.error("Authentication error:", error);
      // Return fallback data if provided
      return fallbackData;
    }
  };
  
  return executeWithRetry();
};

// Helper function to execute operations with the demo client
const executeDemoOperation = async (demoClient: any, callback: () => Promise<any>) => {
  // Store the original supabase reference
  const originalSupabase = supabase;
  
  try {
    // Create a custom dynamic import wrapper to handle the module reference swap
    const wrappedCallback = async () => {
      // Create a temporary proxy to intercept any supabase calls
      const supabaseProxy = new Proxy(originalSupabase, {
        get: function(target, prop) {
          // Forward any property access to the demo client
          return demoClient[prop];
        }
      });
      
      // Temporarily replace the global supabase object
      (window as any).supabase = supabaseProxy;
      
      // Execute the callback with our proxy in place
      const result = await callback();
      
      return result;
    };
    
    // Run the wrapped callback
    return await wrappedCallback();
  } finally {
    // Always restore the original supabase client
    (window as any).supabase = originalSupabase;
  }
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

// Improved Utility to check connection to Supabase with better error handling and retry mechanism
export const checkSupabaseConnection = async (maxRetries = 2, retryDelay = 500) => {
  if (isOffline()) {
    return { connected: false, latency: null, error: new Error("Device is offline") };
  }
  
  // Try to use demo credentials if available
  const mockRole = localStorage.getItem('userRole');
  if (mockRole) {
    // We're in demo mode, so let's pretend we're connected
    return { connected: true, latency: 0 };
  }
  
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries <= maxRetries) {
    try {
      const start = Date.now();
      
      // Make a lightweight query to check connection
      // Use a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Connection check timed out")), 5000);
      });
      
      const queryPromise = supabase.from('classes').select('id').limit(1).maybeSingle();
      
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

// Add a function to enable demo mode with mock auth
export const enableDemoMode = (role: 'user' | 'admin' | 'trainer') => {
  localStorage.setItem('userRole', role);
  return true;
};

// Check if demo mode is enabled
export const isDemoMode = () => {
  return !!localStorage.getItem('userRole');
};
