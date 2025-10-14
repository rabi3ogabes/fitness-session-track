import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar, User, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
  status: string;
}

const RecentBookingsWidget = () => {
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteIcons, setShowDeleteIcons] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load the delete icon visibility setting from localStorage
  useEffect(() => {
    const savedShowBookingDeleteIcon = localStorage.getItem("showBookingDeleteIcon");
    if (savedShowBookingDeleteIcon !== null) {
      setShowDeleteIcons(JSON.parse(savedShowBookingDeleteIcon));
    }

    // Listen for storage changes to update the setting in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "showBookingDeleteIcon" && e.newValue) {
        setShowDeleteIcons(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getGenderIconColor = (gender?: string) => {
    if (gender === "Male") return "text-blue-600";
    if (gender === "Female") return "text-pink-600";
    return "text-gray-600"; // default color for unknown gender
  };

  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        console.log("Fetching recent bookings...");
        // Get recent bookings (both confirmed and cancelled for complete activity view)
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            id,
            user_name,
            booking_date,
            member_id,
            class_id,
            user_id,
            status
          `)
          .in("status", ["confirmed", "cancelled"])
          .order("booking_date", { ascending: false })
          .limit(5);

        if (bookingsError) {
          console.error("Error fetching bookings:", bookingsError);
          throw bookingsError;
        }
        
        console.log("Raw bookings data:", bookingsData);

        // Get class details and member balances for each booking
        const bookingsWithBalance = await Promise.all(
          (bookingsData || []).map(async (booking) => {
            let memberBalance = 0;
            let memberGender = undefined;
            let memberName = "Unknown Member";
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
            
            // Use user_name from booking as initial value
            if (booking.user_name?.trim() && booking.user_name !== "Unknown User") {
              memberName = booking.user_name;
            }
            
            // Get member data - prioritize member_id, then search by username pattern
            if (booking.member_id) {
              // Direct member lookup by ID
              const { data: memberData } = await supabase
                .from("members")
                .select("name, remaining_sessions, gender, email")
                .eq("id", booking.member_id)
                .maybeSingle();
              
              if (memberData) {
                memberName = memberData.name || memberName;
                memberBalance = memberData.remaining_sessions || 0;
                memberGender = memberData.gender;
              }
            } else if (booking.user_name && booking.user_name !== "Unknown User") {
              // Try to find member by searching their email or name patterns
              // First try exact email match using the username as email prefix
              const { data: memberByEmail } = await supabase
                .from("members")
                .select("name, remaining_sessions, gender")
                .ilike("email", `${booking.user_name}%`)
                .maybeSingle();
              
              if (memberByEmail) {
                memberName = memberByEmail.name || memberName;
                memberBalance = memberByEmail.remaining_sessions || 0;
                memberGender = memberByEmail.gender;
              } else {
                // Fallback: search by name pattern (handle reversed names, etc.)
                const searchTerm = booking.user_name.replace(/[._]/g, ' ').trim();
                const { data: memberByName } = await supabase
                  .from("members")
                  .select("name, remaining_sessions, gender")
                  .or(`name.ilike.%${searchTerm}%,name.ilike.%${searchTerm.split(' ').reverse().join(' ')}%`)
                  .maybeSingle();
                
                if (memberByName) {
                  memberName = memberByName.name || memberName;
                  memberBalance = memberByName.remaining_sessions || 0;
                  memberGender = memberByName.gender;
                }
              }
            }

            return {
              id: booking.id,
              user_name: memberName,
              booking_date: booking.booking_date,
              class_name: classDetails.name,
              class_date: classDetails.schedule,
              start_time: classDetails.start_time,
              end_time: classDetails.end_time,
              member_balance: memberBalance,
              member_gender: memberGender,
              status: booking.status, // Add status to track booking state
            };
          })
        );

        console.log("Final bookings with balance:", bookingsWithBalance);
        setRecentBookings(bookingsWithBalance);
      } catch (error) {
        console.error("Error fetching recent bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBookings();

    // Set up comprehensive real-time subscriptions
    const bookingsChannel = supabase
      .channel("recent-bookings-updates")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          console.log("Bookings change detected:", payload);
          fetchRecentBookings();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public", 
          table: "members",
        },
        (payload) => {
          console.log("Member session update detected:", payload);
          fetchRecentBookings();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          console.log("Profile session update detected:", payload);
          fetchRecentBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
    };
  }, []);

  const handleDeleteBooking = async (bookingId: string, bookingStatus: string) => {
    console.log("Delete button clicked for booking:", bookingId, "status:", bookingStatus);
    try {
      // If booking is confirmed, it will be cancelled and credits returned via database trigger
      // If booking is already cancelled, we'll delete it completely
      if (bookingStatus === 'confirmed') {
        const { error } = await supabase
          .from("bookings")
          .update({ status: 'cancelled' })
          .eq("id", bookingId);

        if (error) throw error;
        
        toast({
          title: "Booking cancelled",
          description: "The booking has been cancelled and the session credit has been returned.",
        });
      } else {
        const { error } = await supabase
          .from("bookings")
          .delete()
          .eq("id", bookingId);

        if (error) throw error;
        
        toast({
          title: "Booking deleted",
          description: "The cancelled booking has been removed.",
        });
      }
      
      // Force refresh the bookings data immediately
      console.log("Delete operation completed, refreshing data...");
      // Trigger a manual refresh by calling the fetch function from useEffect
      const refreshBookings = async () => {
        try {
          console.log("Fetching recent bookings...");
          const { data: bookingsData, error: bookingsError } = await supabase
            .from("bookings")
            .select(`
              id,
              user_name,
              booking_date,
              member_id,
              class_id,
              user_id,
              status
            `)
            .in("status", ["confirmed", "cancelled"])
            .order("booking_date", { ascending: false })
            .limit(5);

          if (bookingsError) {
            console.error("Error fetching bookings:", bookingsError);
            return;
          }
          
          // Process the bookings data same as in useEffect
          const bookingsWithBalance = await Promise.all(
            (bookingsData || []).map(async (booking) => {
              let memberBalance = 0;
              let memberGender = undefined;
              let memberName = "Unknown Member";
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
              
              // Use user_name from booking as initial value
              if (booking.user_name?.trim() && booking.user_name !== "Unknown User") {
                memberName = booking.user_name;
              }
              
              // Get member data - prioritize member_id, then search by username pattern
              if (booking.member_id) {
                const { data: memberData } = await supabase
                  .from("members")
                  .select("name, remaining_sessions, gender")
                  .eq("id", booking.member_id)
                  .maybeSingle();
                
                if (memberData) {
                  memberName = memberData.name || memberName;
                  memberBalance = memberData.remaining_sessions || 0;
                  memberGender = memberData.gender;
                }
              } else if (booking.user_name && booking.user_name !== "Unknown User") {
                // Try to find member by email pattern match
                const { data: memberByEmail } = await supabase
                  .from("members")
                  .select("name, remaining_sessions, gender")
                  .ilike("email", `${booking.user_name}%`)
                  .maybeSingle();
                
                if (memberByEmail) {
                  memberName = memberByEmail.name || memberName;
                  memberBalance = memberByEmail.remaining_sessions || 0;
                  memberGender = memberByEmail.gender;
                } else {
                  // Fallback: search by name pattern
                  const searchTerm = booking.user_name.replace(/[._]/g, ' ').trim();
                  const { data: memberByName } = await supabase
                    .from("members")
                    .select("name, remaining_sessions, gender")
                    .or(`name.ilike.%${searchTerm}%,name.ilike.%${searchTerm.split(' ').reverse().join(' ')}%`)
                    .maybeSingle();
                  
                  if (memberByName) {
                    memberName = memberByName.name || memberName;
                    memberBalance = memberByName.remaining_sessions || 0;
                    memberGender = memberByName.gender;
                  }
                }
              }

              return {
                id: booking.id,
                user_name: memberName,
                booking_date: booking.booking_date,
                class_name: classDetails.name,
                class_date: classDetails.schedule,
                start_time: classDetails.start_time,
                end_time: classDetails.end_time,
                member_balance: memberBalance,
                member_gender: memberGender,
                status: booking.status,
              };
            })
          );

          console.log("Refreshed bookings:", bookingsWithBalance);
          setRecentBookings(bookingsWithBalance);
        } catch (error) {
          console.error("Error refreshing bookings:", error);
        }
      };
      
      refreshBookings();
    } catch (error) {
      console.error("Error handling booking:", error);
      toast({
        title: "Error",
        description: "Failed to process the booking. Please try again.",
        variant: "destructive",
      });
    }
  };

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
              className={`p-4 border rounded-md hover:bg-gray-50 transition-colors ${
                booking.status === 'cancelled' 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <User className={`h-4 w-4 ${getGenderIconColor(booking.member_gender)}`} />
                  <h3 className="font-semibold text-gray-900">{booking.user_name}</h3>
                  {booking.status === 'cancelled' && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      Cancelled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Sessions Left</div>
                    <div className={`font-semibold ${booking.member_balance <= 2 ? 'text-red-600' : 'text-green-600'}`}>
                      {booking.member_balance}
                    </div>
                  </div>
                  {showDeleteIcons && (
                    <button
                      onClick={() => handleDeleteBooking(booking.id, booking.status)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title={booking.status === 'confirmed' ? 'Cancel booking and return credit' : 'Delete cancelled booking'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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
                {booking.status === 'cancelled' ? 'Cancelled' : 'Booked'}: {format(new Date(booking.booking_date), 'MMM d, yyyy HH:mm')}
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
      
      <div className="mt-4 pt-4 border-t">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/admin/bookings')}
        >
          View All Bookings
        </Button>
      </div>
    </div>
  );
};

export default RecentBookingsWidget;