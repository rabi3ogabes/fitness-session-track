import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

interface SessionBalanceProps {
  className?: string;
  showIcon?: boolean;
  compact?: boolean;
}

const SessionBalance = ({ className = "", showIcon = true, compact = false }: SessionBalanceProps) => {
  const { user, isAuthenticated } = useAuth();
  const [sessionBalance, setSessionBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch user's session balance
  const fetchSessionBalance = async () => {
    if (!isAuthenticated || !user?.email) return;

    try {
      setLoading(true);
      
      // Try to get data from members table
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("remaining_sessions")
        .eq("email", user.email)
        .maybeSingle();

      if (memberError && memberError.code !== "PGRST116") {
        throw memberError;
      }

      if (memberData) {
        setSessionBalance(memberData.remaining_sessions || 0);
      } else {
        // Fallback to profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("sessions_remaining")
          .eq("email", user.email)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        if (profileData) {
          setSessionBalance(profileData.sessions_remaining || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching session balance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for session balance updates
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;

    fetchSessionBalance();

    // Subscribe to members table changes
    const membersChannel = supabase
      .channel("session-balance-members")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "members",
          filter: `email=eq.${user.email}`,
        },
        (payload) => {
          console.log("Session balance updated (members):", payload);
          if (payload.new && payload.new.remaining_sessions !== undefined) {
            setSessionBalance(payload.new.remaining_sessions);
          }
        }
      )
      .subscribe();

    // Subscribe to profiles table changes
    const profilesChannel = supabase
      .channel("session-balance-profiles")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `email=eq.${user.email}`,
        },
        (payload) => {
          console.log("Session balance updated (profiles):", payload);
          if (payload.new && payload.new.sessions_remaining !== undefined) {
            setSessionBalance(payload.new.sessions_remaining);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated || loading) {
    return null;
  }

  const sessionText = sessionBalance === 1 ? "session" : "sessions";
  const isLow = sessionBalance <= 2;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showIcon && (
        <User className={`h-4 w-4 ${isLow ? "text-red-600" : "text-red-500"}`} />
      )}
      <span 
        className={`font-semibold ${isLow ? "text-red-600" : "text-red-500"} ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {compact ? sessionBalance : `${sessionBalance} ${sessionText}`}
      </span>
    </div>
  );
};

export default SessionBalance;