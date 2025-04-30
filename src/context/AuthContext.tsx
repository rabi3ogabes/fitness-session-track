
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define user types
export type UserRole = "admin" | "user" | "trainer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  signup: (phone: string, password: string, name: string, email?: string, dateOfBirth?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTrainer: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample users for demo - will be removed when Supabase auth is fully implemented
const MOCK_USERS = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@gym.com",
    password: "admin123",
    role: "admin" as UserRole
  },
  {
    id: "2", 
    name: "Regular User",
    email: "user@gym.com",
    password: "user123",
    role: "user" as UserRole
  },
  {
    id: "3",
    name: "Trainer",
    email: "trainer@gym.com",
    password: "trainer123",
    role: "trainer" as UserRole
  }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const { toast } = useToast();

  // Check for stored user on load
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          // Use setTimeout to prevent potential recursion issues
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Try to get user from Supabase profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        // Fallback to mock users for demo
        const mockUser = MOCK_USERS.find(u => u.id === userId);
        if (mockUser) {
          const { password: _, ...userWithoutPassword } = mockUser;
          setUser(userWithoutPassword);
        }
        return;
      }

      if (data) {
        // Determine role based on email for now
        // In a real app, this would come from your profiles table
        let role: UserRole = "user";
        if (data.email?.includes("admin")) {
          role = "admin";
        } else if (data.email?.includes("trainer")) {
          role = "trainer";
        }

        setUser({
          id: data.id,
          name: data.name || "User",
          email: data.email || "",
          role: role,
          phone: data.phone_number
        });
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    }
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      // Check if identifier is an email or phone number
      const isEmail = identifier.includes('@');
      
      let authResponse;
      
      if (isEmail) {
        // Login with email
        authResponse = await supabase.auth.signInWithPassword({
          email: identifier,
          password: password,
        });
      } else {
        // Login with phone as email (phone@example.com)
        authResponse = await supabase.auth.signInWithPassword({
          email: `${identifier}@example.com`,
          password: password,
        });
      }

      const { data, error } = authResponse;
      
      if (error) {
        console.error("Auth error:", error);
        
        // Fallback to mock users for demo
        const mockUser = MOCK_USERS.find(
          u => (u.email === identifier || u.id === identifier) && u.password === password
        );

        if (mockUser) {
          const { password: _, ...userWithoutPassword } = mockUser;
          setUser(userWithoutPassword);
          localStorage.setItem("gymUser", JSON.stringify(userWithoutPassword));
          return true;
        }
        return false;
      }
      
      // Success - session will be handled by onAuthStateChange
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const signup = async (phone: string, password: string, name: string, email?: string, dateOfBirth?: string): Promise<boolean> => {
    try {
      // Validate phone number format (8 digits)
      if (!/^\d{8}$/.test(phone)) {
        toast({
          title: "Invalid phone number",
          description: "Please enter an 8-digit phone number",
          variant: "destructive",
        });
        return false;
      }

      // Create user metadata including all provided info
      const userData = {
        phone_number: phone,
        name: name,
        email: email || '',
        date_of_birth: dateOfBirth || ''
      };

      // Create a user with the phone number as the email (phone@example.com)
      const { data, error } = await supabase.auth.signUp({
        email: email || `${phone}@example.com`,
        password: password,
        options: {
          data: userData
        }
      });

      if (error) {
        console.error("Signup error:", error);
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Signup successful",
        description: "Your account has been created. You can now log in.",
      });
      
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  };

  const logout = () => {
    supabase.auth.signOut().then(() => {
      setUser(null);
      setSession(null);
      localStorage.removeItem("gymUser");
    });
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isTrainer: user?.role === "trainer",
    isUser: user?.role === "user",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
