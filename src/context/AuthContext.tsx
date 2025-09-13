import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  supabase,
  checkSupabaseConnection,
  isOffline,
} from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthTokenResponse, User as SupabaseUser } from "@supabase/supabase-js";

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
  signup: (
    email: string,
    password: string,
    name: string,
    phone?: string,
    dob?: string,
    gender?: string
  ) => Promise<boolean>;
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
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // For roles
  const [role, setRole] = useState<string | null>(null);

  // Debug flag to track loading process
  const [initializationStarted, setInitializationStarted] = useState(false);

  // Create admin user in Supabase if they don't exist
  const createAdminUser = async () => {
    console.log("Checking if admin user needs to be created...");

    try {
      // Check if admin exists in profiles table only
      const { data: existingAdmin, error: checkError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", "admin@gym.com")
        .maybeSingle();

      if (checkError) {
        console.error(`Error checking if admin user exists:`, checkError);
        return;
      }

      // If admin doesn't exist in profiles, try to create them via signup
      if (!existingAdmin) {
        console.log(`Creating admin user via signup`);

        try {
          // Sign up the user (this will work from frontend)
          const { data: authData, error: signupError } =
            await supabase.auth.signUp({
              email: "admin@gym.com",
              password: "admin123",
              options: {
                data: {
                  name: "Admin User",
                  role: "admin",
                },
              },
            });

          if (signupError) {
            // If user already exists in auth but not in profiles, that's fine
            if (signupError.message?.includes("User already registered")) {
              console.log("Admin user exists in auth table, checking profile creation");
              
              // Try to get the current user session to get admin ID
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user?.email === "admin@gym.com") {
                // Current user is admin, create profile
                const { error: profileError } = await supabase
                  .from("profiles")
                  .insert({
                    id: session.user.id,
                    email: "admin@gym.com",
                    name: "Admin User",
                    phone_number: "12345678",
                  });

                if (profileError) {
                  if (!profileError.message.includes("unique constraint")) {
                    console.error(`Error creating profile for admin:`, profileError);
                  } else {
                    console.log("Admin profile already exists");
                  }
                } else {
                  console.log(`Successfully created profile for admin`);
                }
              }
            } else {
              console.error(`Error creating admin auth user:`, signupError);
            }
            return;
          }

          if (authData?.user) {
            console.log(
              `Successfully created admin auth user with ID: ${authData.user.id}`
            );
            const { error: profileError } = await supabase
              .from("profiles")
              .insert({
                id: authData.user.id,
                email: "admin@gym.com",
                name: "Admin User",
                phone_number: "12345678",
              });

            if (profileError) {
              console.error(
                `Error creating profile for admin:`,
                profileError
              );
            } else {
              console.log(`Successfully created profile for admin`);
            }
          }
        } catch (err) {
          console.error(`Error in admin user creation process:`, err);
        }
      } else {
        console.log(`Admin user already exists, skipping creation`);
      }
    } catch (err) {
      console.error(`Unexpected error creating admin user:`, err);
    }
  };

  useEffect(() => {
    console.log("AuthContext initialization started");
    setInitializationStarted(true);
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Set up auth state change listener first
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("Auth state change event:", event);
          if (!isMounted) return;

          if (session) {
            console.log("New session established:", session.user.id);

            // Set user data immediately without waiting for profile data
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || "",
              role: session.user.user_metadata?.role || "",
            });

            // Determine role based on email and metadata immediately
            let userRole = "user";
            if (
              session.user.user_metadata?.role === "admin" ||
              session.user.email?.includes("admin")
            ) {
              userRole = "admin";
            } else if (
              session.user.user_metadata?.role === "trainer" ||
              session.user.email?.includes("trainer")
            ) {
              userRole = "trainer";
            }
            setRole(userRole);

            // Fetch profile info in the background
            setTimeout(() => {
              if (!isMounted) return;

              supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .maybeSingle()
                .then(({ data: profileData }) => {
                  if (!isMounted) return;

                  if (profileData) {
                    setUserProfile({
                      sessions_remaining: profileData.sessions_remaining || 0,
                      total_sessions: profileData.total_sessions || 0,
                    });
                  } else {
                    // Default profile if not found
                    setUserProfile({
                      sessions_remaining: 0,
                      total_sessions: 0,
                    });
                  }
                });
            }, 0);

            // End loading state immediately after setting user data
            setLoading(false);
            console.log(
              "AuthContext loading set to false after session established"
            );
          } else {
            setUser(null);
            setUserProfile(null);
            setRole(null);
            setLoading(false);
            console.log("Session cleared, loading set to false");
          }
        });

        // Check for an existing session with a short timeout
        console.log("Checking for existing session...");
        const sessionPromise = supabase.auth.getSession();

        // Add a short timeout to prevent hanging on session check
        const timeoutPromise = new Promise<{
          data: { session: null };
          error: Error;
        }>((resolve) => {
          setTimeout(() => {
            console.log("Session check timed out, proceeding without session");
            resolve({
              data: { session: null },
              error: new Error("Session check timed out"),
            });
          }, 3000); // Short 3s timeout for initial session check
        });

        // Race the promises to handle potential timeouts
        const {
          data: { session },
          error: sessionError,
        } = await Promise.race([sessionPromise, timeoutPromise]);

        if (sessionError) {
          console.error("Session error:", sessionError);
          if (isMounted) {
            setLoading(false);
            console.log(
              "AuthContext loading set to false due to session error"
            );
          }
        } else if (session) {
          console.log("Session found:", session.user.id);
          // Session handling is done in onAuthStateChange
        } else {
          console.log("No session found");
          if (isMounted) {
            setLoading(false);
            console.log("AuthContext loading set to false (no session)");
          }
        }

        // Create admin user in background
        setTimeout(() => {
          createAdminUser().catch((err) => {
            console.error("Error creating admin user:", err);
          });
        }, 0);

        return () => {
          if (subscription) subscription.unsubscribe();
        };
      } catch (e) {
        console.error("Fatal error in auth initialization:", e);
        if (isMounted) {
          setLoading(false);
          console.log("AuthContext loading set to false after fatal error");
        }
      }
    };

    // Initialize authentication
    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fail-safe to ensure loading state doesn't stay true forever
  useEffect(() => {
    // Force loading to false after a timeout
    const failsafeTimer = setTimeout(() => {
      if (loading && initializationStarted) {
        console.warn(
          "Auth loading failsafe triggered - forcing loading state to false"
        );
        setLoading(false);
      }
    }, 5000); // Reduced from 10 to 5 seconds

    return () => clearTimeout(failsafeTimer);
  }, [loading, initializationStarted]);

  // Debug effect - log loading state changes
  useEffect(() => {
    console.log(`Auth loading state changed: ${loading}`);
  }, [loading]);

  const login = async (email: string, password: string) => {
    try {
      console.log("Login attempt for:", email);

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email format");
      }

      if (!navigator.onLine) {
        throw new Error(
          "You appear to be offline. Please check your internet connection."
        );
      }

      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Login timed out. Please try again.")),
          8000
        );
      });

      const result = (await Promise.race([
        loginPromise,
        timeoutPromise,
      ])) as AuthTokenResponse; // Explicitly type result

      if (result.error) {
        console.error("Supabase auth error:", result.error);

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

      if (result.data?.user) {
        const supabaseUser = result.data.user;
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          name: supabaseUser.user_metadata?.name || "",
          role:
            supabaseUser.app_metadata?.role ||
            supabaseUser.user_metadata?.role ||
            "", // Prioritize app_metadata
        });

        // Determine role based on metadata first, then email as fallback
        let userRole = "user"; // Default role
        if (supabaseUser.app_metadata?.role) {
          userRole = supabaseUser.app_metadata.role;
        } else if (supabaseUser.user_metadata?.role) {
          // Fallback to user_metadata
          userRole = supabaseUser.user_metadata.role;
        } else {
          // Fallback to email sniffing if no metadata role
          if (email.includes("admin")) userRole = "admin";
          else if (email.includes("trainer")) userRole = "trainer";
        }
        setRole(userRole);
        console.log(
          "Role set to:",
          userRole,
          "from metadata:",
          supabaseUser.app_metadata?.role || supabaseUser.user_metadata?.role
        );
      } else {
        // This case should ideally not happen if login is successful without error
        // but handle it defensively.
        console.warn(
          "Login successful but no user data returned in result.data.user"
        );
        // Fallback role determination if user object is somehow missing after successful auth
        let userRole = "user";
        if (email.includes("admin")) userRole = "admin";
        else if (email.includes("trainer")) userRole = "trainer";
        setRole(userRole);
        console.log("Role (fallback) set to:", userRole);
      }

      // Show login balance notification if enabled
      setTimeout(async () => {
        try {
          if (result.data?.user) {
            // Check if user has login balance notification enabled
            const { data: notificationSettings } = await supabase
              .from("notification_settings")
              .select("login_balance_notification")
              .eq("user_id", result.data.user.id)
              .maybeSingle();

            if (notificationSettings?.login_balance_notification !== false) {
              // Get user's session balance
              const { data: memberData } = await supabase
                .from("members")
                .select("remaining_sessions, name")
                .eq("email", result.data.user.email)
                .maybeSingle();

              if (memberData) {
                const sessions = memberData.remaining_sessions || 0;
                const sessionText = sessions === 1 ? "session" : "sessions";
                
                toast({
                  title: `Welcome back, ${memberData.name}!`,
                  description: `You have ${sessions} ${sessionText} remaining in your account.`,
                  duration: 5000,
                });
              }
            }
          }
        } catch (error) {
          console.error("Error showing login notification:", error);
        }
      }, 1000);

      toast({
        title: "Login successful",
        description: "You have been logged in successfully.",
      });
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage =
        "Login failed. Please check your credentials and try again.";

      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "The email or password you entered is incorrect.";
      } else if (
        !navigator.onLine ||
        error.message?.includes("NetworkError") ||
        error.message?.includes("network")
      ) {
        errorMessage =
          "Unable to connect to the authentication service. Please check your internet connection.";
      } else if (error.message?.includes("timeout")) {
        errorMessage =
          "Login request timed out. The server might be temporarily unavailable. Please try again.";
      } else {
        errorMessage =
          error.message || "An unexpected error occurred. Please try again.";
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw new Error(errorMessage);
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    dob?: string,
    gender?: string
  ) => {
    try {
      console.log("Signup attempt for:", email);

      // First check if there's an actual network connection to Supabase
      const connectionCheck = await checkSupabaseConnection();
      if (!connectionCheck.connected) {
        if (navigator.onLine) {
          throw new Error(
            "Cannot connect to authentication server. Please try again later."
          );
        } else {
          throw new Error(
            "You appear to be offline. Please check your internet connection."
          );
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
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create profile for the user
        await supabase.from("profiles").insert({
          id: data.user.id,
          email: email,
          name: name,
          phone_number: phone || "",
          gender: gender || null,
        });

        // Also add to members table for admin view
        const formattedBirthday = dob || null;

        await supabase.from("members").insert({
          name: name,
          email: email,
          phone: phone || "",
          birthday: formattedBirthday,
          membership: "null",
          sessions: 0,
          remaining_sessions: 0,
          status: "Active",
          gender: gender || "Not specified",
        });
      }

      // Send notification to admin about new signup
      const adminNotificationEmail = localStorage.getItem('adminNotificationEmail');
      const smtpSettings = localStorage.getItem('smtpSettings');
      
      if (adminNotificationEmail && smtpSettings) {
        try {
          const parsedSmtpSettings = JSON.parse(smtpSettings);
          
          // Only send if SMTP settings are properly configured
          if (parsedSmtpSettings.host && parsedSmtpSettings.username && parsedSmtpSettings.password && parsedSmtpSettings.fromEmail) {
            await supabase.functions.invoke('send-smtp-notification', {
              body: {
                userEmail: email,
                userName: name,
                userPhone: phone,
                notificationEmail: adminNotificationEmail,
                smtpSettings: {
                  ...parsedSmtpSettings,
                  useSsl: true
                }
              }
            });
          }
        } catch (error) {
          console.error('Failed to send admin notification:', error);
        }
      }

      toast({
        title: "Sign up successful",
        description:
          "Your account has been created. Please check your email for verification.",
      });

      return true;
    } catch (error: any) {
      console.error("Signup error:", error);

      let errorMessage = "Sign up failed. Please try again later.";

      if (!navigator.onLine || error.message?.includes("NetworkError")) {
        errorMessage =
          "Unable to connect to the authentication service. Please check your internet connection.";
      } else if (error.message?.includes("already registered")) {
        errorMessage =
          "This email is already registered. Please use a different email or try logging in.";
      } else {
        errorMessage =
          error.message || "An unexpected error occurred. Please try again.";
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
          description: "You have been logged out successfully.",
        });
      };

      // Set a timeout for the Supabase logout operation
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          // If it times out, we'll still clear local state
          clearLocalState();
          reject(
            new Error(
              "Logout request timed out, but you've been logged out locally."
            )
          );
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
      if (
        !navigator.onLine ||
        error.message?.includes("NetworkError") ||
        error.message?.includes("timeout")
      ) {
        toast({
          title: "Network Error",
          description:
            "Unable to connect to the authentication service, but you've been logged out locally.",
          variant: "destructive",
        });
      } else {
        // Provide better error messages
        const errorMessage =
          error.message || "An unexpected error occurred. Please try again.";

        toast({
          title: "Logout issue",
          description:
            errorMessage + " However, you've been logged out locally.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isAdmin: role === "admin",
        isTrainer: role === "trainer",
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
