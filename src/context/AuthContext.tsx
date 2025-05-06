
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, checkSupabaseConnection, isOffline } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthTokenResponse } from '@supabase/supabase-js';

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

  // For roles
  const [role, setRole] = useState<string | null>(null);

  // Create admin user in Supabase if they don't exist
  const createAdminUser = async () => {
    console.log("Checking if admin user needs to be created...");
    
    try {
      // Check if admin exists
      const { data: existingAdmin, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'admin@gym.com')
        .limit(1);
        
      if (checkError) {
        console.error(`Error checking if admin user exists:`, checkError);
        return;
      }
      
      // If admin doesn't exist, create them
      if (!existingAdmin || existingAdmin.length === 0) {
        console.log(`Creating admin user`);
        
        // Sign up the user
        const { data: authData, error: signupError } = await supabase.auth.signUp({
          email: 'admin@gym.com',
          password: 'admin123',
          options: {
            data: {
              name: 'Admin User',
              role: 'admin'
            }
          }
        });
        
        if (signupError) {
          console.error(`Error creating admin auth user:`, signupError);
          return;
        }
        
        if (authData.user) {
          console.log(`Successfully created admin auth user with ID: ${authData.user.id}`);
          
          // Create profile entry 
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,  
              email: 'admin@gym.com',
              name: 'Admin User',
              phone_number: '12345678'
            });
            
          if (profileError) {
            console.error(`Error creating profile for admin:`, profileError);
          } else {
            console.log(`Successfully created profile for admin`);
          }
        }
      } else {
        console.log(`Admin user already exists, skipping creation`);
      }
    } catch (err) {
      console.error(`Unexpected error creating admin user:`, err);
    }
  };

  useEffect(() => {
    // Set up auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event);
        if (session) {
          console.log("New session established:", session.user.id);
          
          // Fetch profile info
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          // Set user data
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || profileData?.name || '',
            role: session.user.user_metadata?.role || ''
          });

          // Get user profile
          if (profileData) {
            setUserProfile({
              sessions_remaining: profileData.sessions_remaining || 0, 
              total_sessions: profileData.total_sessions || 0
            });
          } else {
            // Default profile if not found
            setUserProfile({
              sessions_remaining: 0, 
              total_sessions: 0
            });
          }

          // Determine role based on email and metadata
          let userRole = 'user';
          if (session.user.user_metadata?.role === 'admin' || session.user.email?.includes('admin')) {
            userRole = 'admin';
          } else if (session.user.user_metadata?.role === 'trainer' || session.user.email?.includes('trainer')) {
            userRole = 'trainer';
          }
          setRole(userRole);
          console.log("User role set to:", userRole);
        } else {
          setUser(null);
          setUserProfile(null);
          setRole(null);
          console.log("Session cleared");
        }
        setLoading(false);
      }
    );

    // Check for an existing session
    const checkSession = async () => {
      try {
        console.log("Checking for existing session...");
        // Get session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        if (session) {
          console.log("Session found:", session.user.id);
          // Set user info
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '',
          });
          
          // Fetch user profile from profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileData) {
            setUserProfile({
              sessions_remaining: profileData.sessions_remaining || 0,
              total_sessions: profileData.total_sessions || 0
            });
          } else {
            // Default profile if not found
            setUserProfile({
              sessions_remaining: 0, 
              total_sessions: 0
            });
          }
          
          // Determine role based on email and metadata
          let userRole = 'user';
          if (session.user.user_metadata?.role === 'admin' || session.user.email?.includes('admin')) {
            userRole = 'admin';
          } else if (session.user.user_metadata?.role === 'trainer' || session.user.email?.includes('trainer')) {
            userRole = 'trainer';
          }
          setRole(userRole);
          console.log("User role set to:", userRole);
        } else {
          console.log("No session found");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
    
    // Create admin user if they don't exist
    createAdminUser().catch(err => {
      console.error("Error creating admin user:", err);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Login attempt for:", email);
      
      if (!email || !password) {
        throw new Error("Email and password are required");
      }
      
      // Check if email is in the correct format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email format");
      }
      
      // First check if there's an actual network connection to Supabase
      try {
        const connectionCheck = await checkSupabaseConnection();
        if (!connectionCheck.connected) {
          // If we're offline but have navigator.onLine = true, it's likely Supabase that's unreachable
          if (navigator.onLine) {
            throw new Error("Cannot connect to authentication server. Please try again later.");
          } else {
            throw new Error("You appear to be offline. Please check your internet connection.");
          }
        }
      } catch (connectionError) {
        console.error("Connection check failed:", connectionError);
        throw new Error("Cannot establish connection to the authentication server. Please try again later.");
      }
      
      // For regular accounts, use Supabase auth with timeout
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Add a timeout to the login promise to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Login timed out. Please try again.")), 15000);
      });
      
      // Race the login promise against the timeout
      try {
        const result = await Promise.race([loginPromise, timeoutPromise]) as AuthTokenResponse;
        
        if (result.error) {
          console.error("Supabase auth error:", result.error);
          
          // Provide better error messages based on error type
          let errorMessage = "An unexpected error occurred. Please try again.";
          
          if (result.error.message) {
            if (result.error.message.includes("Invalid login credentials")) {
              errorMessage = "The email or password you entered is incorrect.";
            } else if (result.error.message.includes("Email not confirmed")) {
              errorMessage = "Please verify your email before logging in.";
            } else {
              errorMessage = result.error.message;
            }
          }
          
          toast({
            title: "Login failed",
            description: errorMessage,
            variant: "destructive",
          });
          
          throw new Error(errorMessage);
        }
        
        console.log("Login successful for:", email);
        
        // Determine role based on email
        let userRole = 'user';
        if (email.includes('admin')) userRole = 'admin';
        if (email.includes('trainer')) userRole = 'trainer';
        
        setRole(userRole);
        console.log("Role set to:", userRole);

        toast({
          title: "Login successful",
          description: "You have been logged in successfully."
        });
      } catch (error: any) {
        console.error("Login race error:", error);
        
        // Check if it's our timeout error
        if (error.message?.includes("timed out")) {
          toast({
            title: "Login timed out",
            description: "The server is taking too long to respond. Please try again later.",
            variant: "destructive",
          });
          
          throw new Error("Login attempt failed due to timeout. The server might be temporarily unavailable.");
        }
        
        // Rethrow other errors
        throw error;
      }
      
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Improved error handling
      let errorMessage = "Login failed. Please check your credentials and try again.";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "The email or password you entered is incorrect.";
      } else if (!navigator.onLine || error.message?.includes("NetworkError") || error.message?.includes("network")) {
        errorMessage = "Unable to connect to the authentication service. Please check your internet connection.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Login request timed out. The server might be temporarily unavailable.";
      } else {
        errorMessage = error.message || "An unexpected error occurred. Please try again.";
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw new Error(errorMessage);
    }
  };

  const signup = async (email: string, password: string, name: string, phone?: string, dob?: string) => {
    try {
      console.log("Signup attempt for:", email);
      
      // First check if there's an actual network connection to Supabase
      const connectionCheck = await checkSupabaseConnection();
      if (!connectionCheck.connected) {
        if (navigator.onLine) {
          throw new Error("Cannot connect to authentication server. Please try again later.");
        } else {
          throw new Error("You appear to be offline. Please check your internet connection.");
        }
      }
      
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
      
      if (data.user) {
        // Create profile for the user
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            name: name,
            phone_number: phone || ''
          });

        // Also add to members table for admin view
        const formattedBirthday = dob || null;
        
        await supabase
          .from('members')
          .insert({
            name: name,
            email: email,
            phone: phone || '',
            birthday: formattedBirthday,
            membership: "Basic",
            sessions: 4,
            remaining_sessions: 4,
            status: "Active",
            gender: "Not specified"
          });
      }
      
      console.log("Signup successful for:", email);
      
      toast({
        title: "Sign up successful",
        description: "Your account has been created. Please check your email for verification."
      });
      
      return true;
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Check if it's a network error
      let errorMessage = "Sign up failed. Please try again later.";
      
      if (!navigator.onLine || error.message?.includes("NetworkError")) {
        errorMessage = "Unable to connect to the authentication service. Please check your internet connection.";
      } else if (error.message?.includes("already registered")) {
        errorMessage = "This email is already registered. Please use a different email or try logging in.";
      } else {
        errorMessage = error.message || "An unexpected error occurred. Please try again.";
      }
      
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      console.log("Logout attempt");
      
      // First attempt to clear local state regardless of network
      const clearLocalState = () => {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        console.log("Local state cleared");
        
        toast({
          title: "Logout successful",
          description: "You have been logged out successfully."
        });
      };
      
      // Set a timeout for the Supabase logout operation
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          // If it times out, we'll still clear local state
          clearLocalState();
          reject(new Error("Logout request timed out, but you've been logged out locally."));
        }, 3000);
      });
      
      // Attempt Supabase logout
      const logoutPromise = supabase.auth.signOut().then(({ error }) => {
        if (error) throw error;
        clearLocalState();
        return;
      });
      
      // Race the logout promise against the timeout
      await Promise.race([logoutPromise, timeoutPromise]);
      
    } catch (error: any) {
      console.error("Logout error:", error);
      
      // Always clear local state on error for better UX
      setUser(null);
      setUserProfile(null);
      setRole(null);
      
      // Check if it's a network error
      if (!navigator.onLine || error.message?.includes("NetworkError") || error.message?.includes("timeout")) {
        toast({
          title: "Network Error",
          description: "Unable to connect to the authentication service, but you've been logged out locally.",
          variant: "destructive",
        });
      } else {
        // Provide better error messages
        const errorMessage = error.message || "An unexpected error occurred. Please try again.";
        
        toast({
          title: "Logout issue",
          description: errorMessage + " However, you've been logged out locally.",
          variant: "destructive",
        });
      }
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
