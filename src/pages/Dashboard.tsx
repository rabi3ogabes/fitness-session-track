
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import BookingForm from "@/components/BookingForm";
import { Calendar, Clock, BookOpen, Bell } from "lucide-react";

// Mock user data
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
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate("/admin");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <DashboardLayout title="User Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Upcoming Classes"
              value={userData.upcomingClasses.length}
              icon={<Calendar className="h-6 w-6 text-gym-blue" />}
            />
            <StatsCard
              title="Sessions Remaining"
              value={userData.membership.sessions.remaining}
              icon={<Clock className="h-6 w-6 text-gym-blue" />}
              change="2"
              positive={false}
            />
            <StatsCard
              title="Membership Status"
              value={userData.membership.type}
              icon={<BookOpen className="h-6 w-6 text-gym-blue" />}
            />
          </div>

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
          <BookingForm remainingSessions={userData.membership.sessions.remaining} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
