
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    // Set up auth state change listener first
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

    // Then check for an existing session
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
          console.log("No session found");
          
          // Check if we have demo credentials
          const mockRole = localStorage.getItem('userRole');
          if (mockRole) {
            // For demo purposes, auto-login with the stored role
            const demoEmails = ['admin@gym.com', 'trainer@gym.com', 'user@gym.com'];
            const isDemoUser = demoEmails.some(email => email.includes(mockRole.toLowerCase()));
            
            if (isDemoUser) {
              console.log("Demo credentials found, establishing demo session");
              
              // Create mock user object for demo purposes
              const mockUser = {
                id: `demo-${mockRole}-id`,
                email: `${mockRole}@gym.com`,
                name: mockRole.charAt(0).toUpperCase() + mockRole.slice(1),
                role: mockRole
              };
              
              // Set user without requiring actual authentication
              setUser(mockUser);
              setUserProfile({
                sessions_remaining: 7,
                total_sessions: 12
              });
              
              // Store the role for demo access
              setRole(mockRole);
              console.log("Demo user session established:", mockUser);
            }
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
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
      
      if (!email || !password) {
        throw new Error("Email and password are required");
      }
      
      // Check if email is in the correct format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email format");
      }
      
      // Check if demo credentials are being used
      const isDemoCredential = 
        (email === "admin@gym.com" && password === "admin123") ||
        (email === "user@gym.com" && password === "user123") ||
        (email === "trainer@gym.com" && password === "trainer123");
      
      if (isDemoCredential) {
        console.log("Using demo credentials - bypassing Supabase auth");
        
        // Determine the role from the email
        let mockRole = 'user';
        if (email.includes('admin')) mockRole = 'admin';
        if (email.includes('trainer')) mockRole = 'trainer';
        
        // Store the role in localStorage
        localStorage.setItem('userRole', mockRole);
        setRole(mockRole);
        
        // Create mock user object
        const mockUser = {
          id: `demo-${mockRole}-id`,
          email: email,
          name: mockRole.charAt(0).toUpperCase() + mockRole.slice(1),
          role: mockRole
        };
        
        setUser(mockUser);
        setUserProfile({
          sessions_remaining: 7,
          total_sessions: 12
        });
        
        toast({
          title: "Demo login successful",
          description: `You've been logged in as a ${mockRole}`
        });
        
        return;
      }
      
      // For non-demo accounts, use Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase auth error:", error);
        
        // Provide better error messages based on error type
        let errorMessage = "An unexpected error occurred. Please try again.";
        
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "The email or password you entered is incorrect.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please verify your email before logging in.";
        }
        
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        throw new Error(errorMessage);
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
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Improved error handling
      let errorMessage = "Login failed. Please check your credentials and try again.";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "The email or password you entered is incorrect.";
      } else if (!navigator.onLine || error.message?.includes("NetworkError") || error.message?.includes("network")) {
        errorMessage = "Unable to connect to the authentication service. Please check your internet connection.";
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
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Check if it's a network error
      let errorMessage = "Sign up failed. Please try again later.";
      
      if (!navigator.onLine || error.message?.includes("NetworkError")) {
        errorMessage = "Unable to connect to the authentication service. Please check your internet connection.";
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
    } catch (error: any) {
      console.error("Logout error:", error);
      
      // Check if it's a network error
      if (!navigator.onLine || error.message?.includes("NetworkError")) {
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
        const errorMessage = error.message || "An unexpected error occurred. Please try again.";
        
        toast({
          title: "Logout failed",
          description: errorMessage,
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
