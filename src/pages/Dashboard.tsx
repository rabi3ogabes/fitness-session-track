import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import BookingForm from "@/components/BookingForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Bell, Settings } from "lucide-react";
import { supabase, requireAuth } from "@/integrations/supabase/client";
import useComingClass from "@/hooks/useComingClass";

// Mock user data - we will overlay this with real data from Supabase if available
// const userData = {
//   name: "John Doe",
//   email: "john@example.com",
//   membership: {
//     type: "Basic",
//     sessions: {
//       total: 12,
//       used: 5,
//       remaining: 7,
//     },
//     expiry: "2025-06-15",
//   },
//   upcomingClasses: [
//     {
//       id: 1,
//       name: "Morning Yoga",
//       date: "2025-05-01",
//       time: "08:00 AM",
//       trainer: "Jane Doe",
//     },
//     {
//       id: 2,
//       name: "HIIT Workout",
//       date: "2025-05-03",
//       time: "10:00 AM",
//       trainer: "John Smith",
//     },
//   ],
//   notifications: [
//     {
//       id: 1,
//       message: "Your session is scheduled for tomorrow at 8:00 AM",
//       date: "2025-04-30",
//     },
//     {
//       id: 2,
//       message: "You have 7 sessions remaining in your membership",
//       date: "2025-04-29",
//     },
//   ],
// };

const Dashboard = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unbookedClasses } = useComingClass();
  const [sessionsRemaining, setSessionsRemaining] = useState<number | string>(0);
  
  // Calculate upcoming classes for next 7 days
  const upcomingClassesNext7Days = unbookedClasses.filter(cls => {
    const classDate = new Date(cls.schedule);
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);
    
    return classDate >= today && classDate <= next7Days;
  });
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [userMembership, setUserMembership] = useState("Basic");
  const [showLowSessionWarning, setShowLowSessionWarning] = useState(true);
  const [loginBalanceNotification, setLoginBalanceNotification] = useState(true);
  const [loadingNotificationSettings, setLoadingNotificationSettings] = useState(true);
  //   console.log(user, "user");
  // console.log(unbookedClasses, "unbookedClasses");
  // console.log(userData, "userData");
  // console.log(userMembership, "userMembership");
  // console.log(loadingUserData, "loadingUserData");
  // console.log(sessionsRemaining, "loadingUserData");
  const fetchUserData = async () => {
    if (!isAuthenticated || !user?.email) return;

    try {
      setLoadingUserData(true);
      // Try to get user's profile from the profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("sessions_remaining, membership_type")
        .eq("email", user.email)
        .maybeSingle();
    
      if (profileError) throw profileError;

      // If we have profile data, use it
      if (profileData) {
        setSessionsRemaining(profileData.sessions_remaining ?? 0);
        setUserMembership(profileData.membership_type || "Basic");
      } else {
        // Try to get data from members table as fallback
        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select("remaining_sessions, membership")
          .eq("email", user.email)
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

  const fetchNotificationSettings = async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      setLoadingNotificationSettings(true);
      const { data, error } = await supabase
        .from("notification_settings")
        .select("login_balance_notification")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setLoginBalanceNotification(data.login_balance_notification);
      } else {
        // Create default settings if none exist
        const { error: insertError } = await supabase
          .from("notification_settings")
          .insert({
            user_id: user.id,
            login_balance_notification: true,
          });

        if (insertError) {
          console.error("Error creating notification settings:", insertError);
        }
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
    } finally {
      setLoadingNotificationSettings(false);
    }
  };

  const updateNotificationSetting = async (enabled: boolean) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("notification_settings")
        .upsert({
          user_id: user.id,
          login_balance_notification: enabled,
        });

      if (error) throw error;

      setLoginBalanceNotification(enabled);
      toast({
        title: "Settings updated",
        description: `Login balance notification ${enabled ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast({
        title: "Error updating settings",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate("/admin");
    } else {
      fetchUserData();
      fetchNotificationSettings();
    }
    
    // Load admin setting for low session warning visibility
    const savedShowLowSessionWarning = localStorage.getItem("showLowSessionWarning");
    if (savedShowLowSessionWarning !== null) {
      setShowLowSessionWarning(JSON.parse(savedShowLowSessionWarning));
    }
  }, [isAuthenticated, isAdmin, navigate, user, toast]);

  // Set up real-time subscription for session count changes
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;

    // Get the channel for the subscription
    const channel = supabase
      .channel("sessions-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "members",
          filter: `email=eq.${user.email}`,
        },
        (payload) => {
          console.log("Member data changed:", payload);
          if (payload.new && payload.new.remaining_sessions !== undefined) {
            setSessionsRemaining(payload.new.remaining_sessions);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `email=eq.${user.email}`,
        },
        (payload) => {
          console.log("Profile data changed:", payload);
          if (payload.new && payload.new.sessions_remaining !== undefined) {
            setSessionsRemaining(payload.new.sessions_remaining);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user]);

  const isLowOnSessions =
    typeof sessionsRemaining === "number" && sessionsRemaining <= 2;
  return (
    <DashboardLayout title="User Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatsCard
              title="Upcoming Classes on the next 7 days"
              value={upcomingClassesNext7Days.length}
              icon={<Calendar className="h-6 w-6 text-gym-blue" />}
            />
            <StatsCard
              title="Sessions Remaining"
              value={loadingUserData ? "..." : sessionsRemaining}
              icon={<Clock className="h-6 w-6 text-gym-blue" />}
              change={
                isLowOnSessions ? sessionsRemaining.toString() : undefined
              }
              positive={false}
            />
          </div>

          {isLowOnSessions && showLowSessionWarning && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertTitle className="text-red-500">
                Low Session Count Warning
              </AlertTitle>
              <AlertDescription>
                <p>
                  You only have {sessionsRemaining}{" "}
                  {sessionsRemaining === 1 ? "session" : "sessions"} remaining!
                </p>
                <Link
                  to="/user/membership"
                  className="text-red-600 font-medium underline hover:text-red-800 mt-2 inline-block"
                >
                  Click here to upgrade your membership
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Upcoming Classes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gym-blue" />
              Upcoming Classes
            </h2>
            {upcomingClassesNext7Days.length > 0 ? (
              <div className="space-y-3">
                {upcomingClassesNext7Days.slice(0, 5).map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 border border-gray-200 rounded-md flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(cls.schedule).toLocaleDateString()} at {cls.start_time}
                      </p>
                      <p className="text-xs text-gray-500">
                        Trainer: {cls.trainer} • {cls.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {cls.enrolled}/{cls.capacity}
                      </div>
                      <div className="text-xs text-gray-500">enrolled</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No upcoming classes in the next 7 days.
              </p>
            )}
          </div>

          {/* <div className="bg-white rounded-lg shadow-md p-6">
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
          </div> */}
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="login-notification" className="text-sm font-medium">
                    Login Balance Notification
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show session balance when you log in
                  </p>
                </div>
                <Switch
                  id="login-notification"
                  checked={loginBalanceNotification}
                  onCheckedChange={updateNotificationSetting}
                  disabled={loadingNotificationSettings}
                />
              </div>
            </CardContent>
          </Card>

          <BookingForm remainingSessions={Number(sessionsRemaining)} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
