
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session, User, AuthError } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  role?: string;
  name?: string;
}

interface UserProfile {
  sessions_remaining: number;
  total_sessions: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTrainer: boolean;
  user: User | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string, phone?: string, dob?: string) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAdmin: false,
  isTrainer: false,
  user: null,
  userProfile: null,
  login: async () => {},
  logout: async () => {},
  signup: async () => false,
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // For mock purposes, let's define roles
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state change listener first to catch all auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event);
        if (session) {
          console.log("New session established:", session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '',
          });

          // In a real implementation, fetch user profile
          const mockUserProfile = {
            sessions_remaining: 7, 
            total_sessions: 12
          };
          setUserProfile(mockUserProfile);

          // For mock purposes
          const mockRole = localStorage.getItem('userRole') || 'user';
          setRole(mockRole);
          console.log("User role set to:", mockRole);
        } else {
          setUser(null);
          setUserProfile(null);
          setRole(null);
          console.log("Session cleared");
        }
        setLoading(false);
      }
    );

    // Check for an existing session after setting up the listener
    const checkSession = async () => {
      try {
        console.log("Checking for existing session...");
        // Set a timeout for faster response
        const timeoutPromise = new Promise<{data: {session: null}, error: Error}>((_, reject) => 
          setTimeout(() => reject(new Error("Session check timed out")), 5000)
        );
        
        // Race between the session check and the timeout
        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([sessionPromise, timeoutPromise])
          .catch(error => {
            console.log("Session check timed out, proceeding without session");
            return { data: { session: null }, error: error as Error };
          });
        
        // Type guard to check if result has data property and session inside data
        if ('data' in result && result.data && 'session' in result.data && result.data.session) {
          console.log("Session found:", result.data.session.user.id);
          // Set user info
          setUser({
            id: result.data.session.user.id,
            email: result.data.session.user.email || '',
            name: result.data.session.user.user_metadata?.name || '',
          });
          
          // In a real implementation, fetch user profile from profiles table
          // For now, we'll use mock data
          const mockUserProfile = {
            sessions_remaining: 7,
            total_sessions: 12
          };
          
          setUserProfile(mockUserProfile);
          
          // For mock purposes, set role
          // In a real app, you would fetch this from your database
          const mockRole = localStorage.getItem('userRole') || 'user';
          setRole(mockRole);
          console.log("User role set to:", mockRole);
        } else {
          console.log("No session found or check timed out");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        // Ensure loading is set to false even if there's an error
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Login attempt for:", email);
      
      // Set a timeout for the login request
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => 
        setTimeout(() => reject(new Error("Login request timed out")), 10000)
      );
      
      // Race between the login request and the timeout
      const result = await Promise.race([loginPromise, timeoutPromise])
        .catch(error => {
          // If it's a timeout, check for demo credentials
          const isDemoAccount = 
            (email === "admin@gym.com" && password === "admin123") ||
            (email === "user@gym.com" && password === "user123") ||
            (email === "trainer@gym.com" && password === "trainer123");
          
          if (isDemoAccount) {
            console.log("Login timed out for demo account - using fallback mode");
            return { data: null, error: new Error("Connection timeout - using demo mode") };
          }
          
          throw error;
        });
      
      if ('error' in result && result.error) {
        console.error("Supabase auth error:", result.error);
        
        // Check for demo accounts with connection issues
        const isDemoAccount = 
          (email === "admin@gym.com" && password === "admin123") ||
          (email === "user@gym.com" && password === "user123") ||
          (email === "trainer@gym.com" && password === "trainer123");
        
        // Safely access error message
        const errorMessage = result.error instanceof Error ? result.error.message : String(result.error);
        
        if (isDemoAccount && (errorMessage.includes("timeout") || errorMessage.includes("NetworkError") || errorMessage.includes("network") || !navigator.onLine)) {
          console.log("Demo account login with network issue - bypassing for testing");
          
          // Mock successful login for demo accounts when offline or having connection issues
          const mockRole = email.includes('admin') ? 'admin' : email.includes('trainer') ? 'trainer' : 'user';
          localStorage.setItem('userRole', mockRole);
          setRole(mockRole);
          
          // Create mock user
          setUser({
            id: 'demo-user-id',
            email: email,
            name: mockRole.charAt(0).toUpperCase() + mockRole.slice(1),
            role: mockRole
          });
          
          // Create mock profile
          setUserProfile({
            sessions_remaining: 7,
            total_sessions: 12
          });
          
          toast({
            title: "Demo mode activated",
            description: "You've been logged in using demo mode due to connection issues with Supabase."
          });
          
          return;
        }
        
        // Improved error handling
        if (errorMessage.includes("Invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "The email or password you entered is incorrect.",
            variant: "destructive",
          });
        } else if (!navigator.onLine || errorMessage.includes("NetworkError") || errorMessage.includes("network")) {
          toast({
            title: "Connection Error",
            description: "Unable to connect to the authentication service. Please check your internet connection.",
            variant: "destructive",
          });
        } else {
          // Provide better error messages
          const displayErrorMessage = errorMessage || "An unexpected error occurred. Please try again.";
          
          toast({
            title: "Login failed",
            description: displayErrorMessage,
            variant: "destructive",
          });
        }
        throw result.error;
      }
      
      console.log("Login successful for:", email);
      
      // For mock purposes, based on email determine role
      let mockRole = 'user';
      if (email.includes('admin')) mockRole = 'admin';
      if (email.includes('trainer')) mockRole = 'trainer';
      
      // Store the role in localStorage for mock purposes
      localStorage.setItem('userRole', mockRole);
      setRole(mockRole);
      console.log("Role set to:", mockRole);

      toast({
        title: "Login successful",
        description: "You have been logged in successfully."
      });
    } catch (error: unknown) {
      console.error("Login error:", error);
      
      // For demo purposes, check if using demo credentials but having connection issues
      const isDemoAccount = 
        (email === "admin@gym.com" && password === "admin123") ||
        (email === "user@gym.com" && password === "user123") ||
        (email === "trainer@gym.com" && password === "trainer123");
      
      // Safely extract error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (isDemoAccount && (errorMessage.includes("NetworkError") || errorMessage.includes("network") || !navigator.onLine)) {
        console.log("Demo account login with network issue - bypassing for testing");
        
        // Mock successful login for demo accounts when offline or having connection issues
        const mockRole = email.includes('admin') ? 'admin' : email.includes('trainer') ? 'trainer' : 'user';
        localStorage.setItem('userRole', mockRole);
        setRole(mockRole);
        
        // Create mock user
        setUser({
          id: 'demo-user-id',
          email: email,
          name: mockRole.charAt(0).toUpperCase() + mockRole.slice(1),
          role: mockRole
        });
        
        // Create mock profile
        setUserProfile({
          sessions_remaining: 7,
          total_sessions: 12
        });
        
        toast({
          title: "Demo mode activated",
          description: "You've been logged in using demo mode due to connection issues with Supabase."
        });
        
        return;
      }
      
      // Improved error handling
      if (errorMessage.includes("Invalid login credentials")) {
        toast({
          title: "Invalid credentials",
          description: "The email or password you entered is incorrect.",
          variant: "destructive",
        });
      } else if (!navigator.onLine || errorMessage.includes("NetworkError") || errorMessage.includes("network")) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to the authentication service. Please check your internet connection.",
          variant: "destructive",
        });
      } else {
        // Provide better error messages
        const displayErrorMessage = errorMessage || "An unexpected error occurred. Please try again.";
        
        toast({
          title: "Login failed",
          description: displayErrorMessage,
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, phone?: string, dob?: string) => {
    try {
      console.log("Signup attempt for:", email);
      // Register new user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone_number: phone,
            date_of_birth: dob,
          }
        }
      });

      if (error) throw error;
      
      console.log("Signup successful for:", email);
      
      toast({
        title: "Sign up successful",
        description: "Your account has been created. Please check your email for verification."
      });
      
      return true;
    } catch (error: unknown) {
      console.error("Signup error:", error);
      
      // Safely extract error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a network error
      if (!navigator.onLine || errorMessage.includes("NetworkError")) {
        toast({
          title: "Network Error",
          description: "Unable to connect to the authentication service. Please check your internet connection.",
          variant: "destructive",
        });
      } else {
        // Provide better error messages
        const displayErrorMessage = errorMessage || "An unexpected error occurred. Please try again.";
        
        toast({
          title: "Sign up failed",
          description: displayErrorMessage,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log("Logout attempt");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem('userRole');
      setUser(null);
      setUserProfile(null);
      setRole(null);

      console.log("Logout successful");
      
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully."
      });
    } catch (error: unknown) {
      console.error("Logout error:", error);
      
      // Safely extract error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a network error
      if (!navigator.onLine || errorMessage.includes("NetworkError")) {
        toast({
          title: "Network Error",
          description: "Unable to connect to the authentication service, but you've been logged out locally.",
          variant: "destructive",
        });
        
        // Still clear local user state even if network request fails
        localStorage.removeItem('userRole');
        setUser(null);
        setUserProfile(null);
        setRole(null);
      } else {
        // Provide better error messages
        const displayErrorMessage = errorMessage || "An unexpected error occurred. Please try again.";
        
        toast({
          title: "Logout failed",
          description: displayErrorMessage,
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isAdmin: role === 'admin',
        isTrainer: role === 'trainer',
        user,
        userProfile,
        login,
        logout,
        signup,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
