import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import BookingForm from "@/components/BookingForm";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { supabase, cancelClassBooking } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Define types for our booking data from Supabase
interface Booking {
  id: string; // UUID from Supabase
  className: string;
  date: string;
  time: string;
  trainer: string;
  status: string;
  attendance?: boolean | null;
}

interface BookingsState {
  upcomingBookings: Booking[];
  pastBookings: Booking[];
  remainingSessions: number;
}

const UserBooking = () => {
  const [bookings, setBookings] = useState<BookingsState>({
    upcomingBookings: [],
    pastBookings: [],
    remainingSessions: 0
  });
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUserData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Fetch profile data (sessions remaining)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('sessions_remaining, total_sessions')
        .eq('id', user.id) // user.id is UUID string
        .single();
        
      if (profileError) throw profileError;
      
      let sessionsRemaining = 7; // Default value
      // Ensure profileData is an object and has the property before accessing it
      if (profileData && typeof profileData === 'object' && 'sessions_remaining' in profileData) {
        sessionsRemaining = (profileData as { sessions_remaining: number | null }).sessions_remaining ?? 7;
      }

      // Fetch bookings data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          status,
          attendance,
          notes,
          classes (
            name,
            trainer
          )
        `)
        .eq('user_id', user.id);

      if (bookingsError) throw bookingsError;

      const now = new Date();
      const formattedUpcomingBookings: Booking[] = [];
      const formattedPastBookings: Booking[] = [];

      if (bookingsData) {
        bookingsData.forEach(booking => {
          // Ensure booking.classes is not null, which can happen if the join fails or class is deleted
          // Add optional chaining for booking.classes as well
          if (!booking.classes) {
            console.warn(`Booking with ID ${booking.id} is missing class details.`);
            // Optionally create a booking detail with placeholder class info
            const bookingDetails: Booking = {
              id: booking.id,
              className: "Unknown Class",
              date: new Date(booking.booking_date).toISOString().split('T')[0],
              time: new Date(booking.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
              trainer: "N/A",
              status: booking.status,
              attendance: booking.attendance,
            };
            if (new Date(booking.booking_date) >= now) {
                formattedUpcomingBookings.push(bookingDetails);
            } else {
                formattedPastBookings.push(bookingDetails);
            }
            return; 
          }
          const bookingDate = new Date(booking.booking_date);
          const bookingDetails: Booking = {
            id: booking.id,
            // Use optional chaining here
            className: booking.classes?.name || "Unknown Class", 
            date: bookingDate.toISOString().split('T')[0], // YYYY-MM-DD
            time: bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            // Use optional chaining here
            trainer: booking.classes?.trainer || "N/A", 
            status: booking.status,
            attendance: booking.attendance,
          };

          if (bookingDate >= now) {
            formattedUpcomingBookings.push(bookingDetails);
          } else {
            formattedPastBookings.push(bookingDetails);
          }
        });
      }
      
      formattedUpcomingBookings.sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime());
      formattedPastBookings.sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());
      
      setBookings({
        upcomingBookings: formattedUpcomingBookings,
        pastBookings: formattedPastBookings,
        remainingSessions: sessionsRemaining
      });

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error loading data",
        description: "Could not load your booking data. Please try again later.",
        variant: "destructive"
      });
      setBookings({
        upcomingBookings: [],
        pastBookings: [],
        remainingSessions: 7 // Fallback
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUserData();
  }, [user, toast]); // fetchUserData is now stable

  const handleCancelBooking = async (bookingId: string) => { // Changed id type to string
    if (!user) return;
    try {
      await cancelClassBooking(bookingId, user.id);
      
      // Re-fetch all data to update lists and potentially remaining sessions
      await fetchUserData(); 
      
      toast({
        title: "Booking cancelled",
        description: "Your booking has been successfully cancelled.",
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error cancelling booking",
        description: (error as Error).message || "Could not cancel your booking. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleBookingComplete = async () => {
    // Assuming BookingForm.tsx handles DB updates for new booking & sessions_remaining.
    // We just need to refresh the data here.
    await fetchUserData();
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Book Session">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-blue"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Book Session">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex space-x-4 border-b mb-4">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`py-2 px-1 -mb-px ${
                  activeTab === "upcoming"
                    ? "text-gym-blue border-b-2 border-gym-blue font-medium"
                    : "text-gray-500"
                }`}
              >
                Upcoming Sessions
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`py-2 px-1 -mb-px ${
                  activeTab === "past"
                    ? "text-gym-blue border-b-2 border-gym-blue font-medium"
                    : "text-gray-500"
                }`}
              >
                Past Sessions
              </button>
            </div>

            {activeTab === "upcoming" && (
              <>
                <h2 className="text-xl font-bold mb-4">Upcoming Sessions</h2>
                {bookings.upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.upcomingBookings.map((booking) => (
                      <div key={booking.id} className="p-4 border border-gray-200 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-gym-light rounded-md">
                              <Calendar className="h-5 w-5 text-gym-blue" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{booking.className}</h3>
                              <p className="text-sm text-gray-500">
                                {booking.date} • {booking.time}
                              </p>
                              <p className="text-sm text-gray-500">
                                Trainer: {booking.trainer}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`mr-3 px-2 py-1 text-xs rounded-full ${
                              booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800' // For other statuses like 'Pending'
                            }`}>
                              {booking.status}
                            </span>
                            {booking.status === 'Confirmed' && (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="text-sm text-red-500 hover:text-red-700"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No upcoming sessions booked.</p>
                )}
              </>
            )}

            {activeTab === "past" && (
              <>
                <h2 className="text-xl font-bold mb-4">Past Sessions</h2>
                {bookings.pastBookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.pastBookings.map((booking) => (
                      <div key={booking.id} className="p-4 border border-gray-200 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-gray-100 rounded-md">
                              <Calendar className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{booking.className}</h3>
                              <p className="text-sm text-gray-500">
                                {booking.date} • {booking.time}
                              </p>
                              <p className="text-sm text-gray-500">
                                Trainer: {booking.trainer}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {booking.status === "Completed" || booking.status === "Attended" ? ( // Added Attended
                              <div className="flex items-center">
                                {booking.attendance === true ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                ) : booking.attendance === false ? ( // Explicitly check for false for Absent
                                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                ) : null } {/* Or some indicator for not marked */}
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  booking.attendance ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800" // Consider if !booking.attendance (absent) should be red
                                }`}>
                                  {booking.attendance === true ? "Attended" : booking.attendance === false ? "Absent" : booking.status} 
                                </span>
                              </div>
                            ) : (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {booking.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No past sessions found.</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <BookingForm 
            remainingSessions={bookings.remainingSessions}
            onBookingComplete={handleBookingComplete}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserBooking;
