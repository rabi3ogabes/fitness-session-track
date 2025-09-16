import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import UpcomingClassWidget from "@/components/UpcomingClassWidget";

import RecentMembersWidget from "@/components/RecentMembersWidget";
import RecentBookingsWidget from "@/components/RecentBookingsWidget";
import BalanceRequestsWidget from "@/components/BalanceRequestsWidget";
import { Users, User, Calendar, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Mock admin data
const adminData = {
  stats: {
    members: 124,
    trainers: 8,
    classes: 46,
    payments: 156,
  },
  recentMembers: [
    { id: 1, name: "Sarah Johnson", email: "sarah@example.com", date: "2025-04-28", membership: "Premium" },
    { id: 2, name: "Michael Brown", email: "michael@example.com", date: "2025-04-27", membership: "Basic" },
    { id: 3, name: "Emma Wilson", email: "emma@example.com", date: "2025-04-26", membership: "Standard" },
  ],
  recentPayments: [
    { id: 1, member: "Sarah Johnson", amount: 120, date: "2025-04-28", status: "Completed" },
    { id: 2, member: "David Lee", amount: 80, date: "2025-04-27", status: "Completed" },
    { id: 3, member: "Emma Wilson", amount: 95, date: "2025-04-25", status: "Completed" },
  ],
  alerts: [
    { id: 1, message: "5 members have memberships expiring this week", type: "warning" },
    { id: 2, message: "3 new member registrations require approval", type: "info" },
    { id: 3, message: "Morning Yoga class is fully booked", type: "success" },
  ],
  classSchedule: [
    { id: 1, name: "Morning Yoga", date: new Date(2025, 4, 1), time: "7:00 AM - 8:00 AM", trainer: "Jane Smith" },
    { id: 2, name: "HIIT Workout", date: new Date(2025, 4, 2), time: "6:00 PM - 7:00 PM", trainer: "Mike Johnson" },
    { id: 3, name: "Strength Training", date: new Date(2025, 4, 3), time: "5:00 PM - 6:00 PM", trainer: "Sarah Davis" },
    { id: 4, name: "Pilates", date: new Date(2025, 4, 4), time: "9:00 AM - 10:00 AM", trainer: "Emma Wilson" },
  ]
};

const AdminDashboard = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    members: 0,
    trainers: 0,
    classes: 0,
  });
  
  const fetchStats = async () => {
    try {
      // Fetch members count
      const { count: membersCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });

      // Fetch trainers count  
      const { count: trainersCount } = await supabase
        .from('trainers')
        .select('*', { count: 'exact', head: true });

      // Fetch active classes count
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');

      setStats({
        members: membersCount || 0,
        trainers: trainersCount || 0,
        classes: classesCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      navigate("/dashboard");
    }

    if (isAuthenticated && isAdmin) {
      fetchStats();
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    // Set up real-time subscriptions for all tables
    const membersChannel = supabase
      .channel('members_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, fetchStats)
      .subscribe();

    const trainersChannel = supabase
      .channel('trainers_changes')  
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trainers' }, fetchStats)
      .subscribe();

    const classesChannel = supabase
      .channel('classes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(trainersChannel);
      supabase.removeChannel(classesChannel);
    };
  }, [isAuthenticated, isAdmin]);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <StatsCard
             title="Total Members"
             value={stats.members}
             icon={<Users className="h-6 w-6 text-gym-blue" />}
             change="12"
             positive={true}
           />
           <StatsCard
             title="Trainers"
             value={stats.trainers}
             icon={<User className="h-6 w-6 text-gym-blue" />}
             change="1"
             positive={true}
           />
           <StatsCard
             title="Active Classes"
             value={stats.classes}
             icon={<Calendar className="h-6 w-6 text-gym-blue" />}
             change="3"
             positive={true}
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentMembersWidget />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <UpcomingClassWidget />
          </div>
        </div>
        
        {/* Recent Activity Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <RecentBookingsWidget />
          <BalanceRequestsWidget />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
