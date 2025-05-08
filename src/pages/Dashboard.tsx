import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import BookingForm from "@/components/BookingForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, Bell } from "lucide-react";
import { supabase, requireAuth } from "@/integrations/supabase/client";

// Mock user data - we will overlay this with real data from Supabase if available
const userData = {
  name: "John Doe",
  email: "john@example.com",
  membership: {
    type: "Basic",
    sessions: {
      total: 12,
      used: 5,
      remaining: 7,
    },
    expiry: "2025-06-15",
  },
  upcomingClasses: [
    {
      id: 1,
      name: "Morning Yoga",
      date: "2025-05-01",
      time: "08:00 AM",
      trainer: "Jane Doe",
    },
    {
      id: 2,
      name: "HIIT Workout",
      date: "2025-05-03",
      time: "10:00 AM",
      trainer: "John Smith",
    },
  ],
  notifications: [
    {
      id: 1,
      message: "Your session is scheduled for tomorrow at 8:00 AM",
      date: "2025-04-30",
    },
    {
      id: 2,
      message: "You have 7 sessions remaining in your membership",
      date: "2025-04-29",
    },
  ],
};

const Dashboard = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessionsRemaining, setSessionsRemaining] = useState<number | string>(0);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [userMembership, setUserMembership] = useState(userData.membership.type);
  
  // Function to fetch the user's session data from Supabase
  const fetchUserData = async () => {
    if (!isAuthenticated || !user?.email) return;
    
    try {
      setLoadingUserData(true);
      // Try to get user's profile from the profiles table
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('sessions_remaining, membership_type')
        .eq('email', user.email)
        .maybeSingle();
        
      if (profileError) throw profileError;
      
      // If we have profile data, use it
      if (profileData) {
        setSessionsRemaining(profileData.sessions_remaining ?? 0);
        setUserMembership(profileData.membership_type || "Basic");
      } else {
        // Try to get data from members table as fallback
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('remaining_sessions, membership')
          .eq('email', user.email)
          .maybeSingle();
          
        if (memberError) throw memberError;
        
        if (memberData) {
          setSessionsRemaining(memberData.remaining_sessions ?? 0);
          setUserMembership(memberData.membership || "Basic");
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error fetching your session data",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoadingUserData(false);
    }
  };
  
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate("/admin");
    } else {
      fetchUserData();
    }
  }, [isAuthenticated, isAdmin, navigate, user, toast]);

  // Set up real-time subscription for session count changes
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    
    // Get the channel for the subscription
    const channel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'members',
          filter: `email=eq.${user.email}`
        },
        (payload) => {
          console.log('Member data changed:', payload);
          if (payload.new && payload.new.remaining_sessions !== undefined) {
            setSessionsRemaining(payload.new.remaining_sessions);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `email=eq.${user.email}`
        },
        (payload) => {
          console.log('Profile data changed:', payload);
          if (payload.new && payload.new.sessions_remaining !== undefined) {
            setSessionsRemaining(payload.new.sessions_remaining);
          }
        }
      )
      .subscribe();
    
    // Clean up the subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user]);

  const isLowOnSessions = typeof sessionsRemaining === 'number' && sessionsRemaining <= 2;

  return (
    <DashboardLayout title="User Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatsCard
              title="Upcoming Classes"
              value={userData.upcomingClasses.length}
              icon={<Calendar className="h-6 w-6 text-gym-blue" />}
            />
            <StatsCard
              title="Sessions Remaining"
              value={loadingUserData ? "..." : sessionsRemaining}
              icon={<Clock className="h-6 w-6 text-gym-blue" />}
              change={isLowOnSessions ? sessionsRemaining.toString() : undefined}
              positive={false}
            />
          </div>

          {isLowOnSessions && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertTitle className="text-red-500">Low Session Count Warning</AlertTitle>
              <AlertDescription>
                <p>You only have {sessionsRemaining} {sessionsRemaining === 1 ? 'session' : 'sessions'} remaining!</p>
                <Link 
                  to="/user/membership" 
                  className="text-red-600 font-medium underline hover:text-red-800 mt-2 inline-block"
                >
                  Click here to upgrade your membership
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Upcoming Classes</h2>
            {userData.upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {userData.upcomingClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-semibold">{cls.name}</h3>
                      <p className="text-sm text-gray-500">
                        {cls.date} • {cls.time}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Trainer: {cls.trainer}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming classes.</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Notifications</h2>
            {userData.notifications.length > 0 ? (
              <div className="space-y-3">
                {userData.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border border-gray-200 rounded-md flex gap-3 items-start"
                  >
                    <Bell className="h-5 w-5 text-gym-blue mt-0.5" />
                    <div>
                      <p>{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No notifications.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <BookingForm remainingSessions={Number(sessionsRemaining)} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
