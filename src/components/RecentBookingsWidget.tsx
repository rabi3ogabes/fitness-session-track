import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar, User, Clock } from "lucide-react";

interface RecentBooking {
  id: string;
  user_name: string;
  booking_date: string;
  class_name: string;
  class_date: string;
  start_time: string;
  end_time: string;
  member_balance: number;
  member_gender?: string;
}

const RecentBookingsWidget = () => {
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const getGenderIconColor = (gender?: string) => {
    if (gender === "Male") return "text-blue-600";
    if (gender === "Female") return "text-pink-600";
    return "text-gray-600"; // default color for unknown gender
  };

  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        // Get recent bookings with class details
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            id,
            user_name,
            booking_date,
            member_id,
            class_id
          `)
          .eq("status", "confirmed")
          .order("booking_date", { ascending: false })
          .limit(5);

        if (bookingsError) throw bookingsError;

        // Get class details and member balances for each booking
        const bookingsWithBalance = await Promise.all(
          (bookingsData || []).map(async (booking) => {
            let memberBalance = 0;
            let memberGender = undefined;
            let classDetails = {
              name: "Unknown Class",
              schedule: "",
              start_time: "",
              end_time: ""
            };
            
            // Get class details
            if (booking.class_id) {
              const { data: classData } = await supabase
                .from("classes")
                .select("name, schedule, start_time, end_time")
                .eq("id", booking.class_id)
                .single();
              
              if (classData) {
                classDetails = classData;
              }
            }
            
            // Get member balance and gender
            if (booking.member_id) {
              const { data: memberData } = await supabase
                .from("members")
                .select("remaining_sessions, gender")
                .eq("id", booking.member_id)
                .single();
              
              memberBalance = memberData?.remaining_sessions || 0;
              memberGender = memberData?.gender;
            }

            return {
              id: booking.id,
              user_name: booking.user_name?.trim() || "Unknown Member",
              booking_date: booking.booking_date,
              class_name: classDetails.name,
              class_date: classDetails.schedule,
              start_time: classDetails.start_time,
              end_time: classDetails.end_time,
              member_balance: memberBalance,
              member_gender: memberGender,
            };
          })
        );

        setRecentBookings(bookingsWithBalance);
      } catch (error) {
        console.error("Error fetching recent bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBookings();

    // Set up real-time subscription for new bookings
    const channel = supabase
      .channel("recent-bookings")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
        },
        () => {
          fetchRecentBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-blue-600" />
        Recent Bookings
      </h2>
      {recentBookings.length > 0 ? (
        <div className="space-y-3">
          {recentBookings.map((booking) => (
            <div
              key={booking.id}
              className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <User className={`h-4 w-4 ${getGenderIconColor(booking.member_gender)}`} />
                  <h3 className="font-semibold text-gray-900">{booking.user_name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Sessions Left</div>
                  <div className={`font-semibold ${booking.member_balance <= 2 ? 'text-red-600' : 'text-green-600'}`}>
                    {booking.member_balance}
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-1">
                <strong>Class:</strong> {booking.class_name}
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{booking.class_date ? format(new Date(booking.class_date), 'MMM d, yyyy') : 'Date TBD'}</span>
                </div>
                {booking.start_time && booking.end_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{booking.start_time} - {booking.end_time}</span>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-400 mt-2">
                Booked: {format(new Date(booking.booking_date), 'MMM d, yyyy HH:mm')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No recent bookings</p>
        </div>
      )}
    </div>
  );
};

export default RecentBookingsWidget;