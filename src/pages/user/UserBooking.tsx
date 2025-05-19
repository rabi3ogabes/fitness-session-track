
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import BookingForm from "@/components/BookingForm";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Define interfaces to type our data
interface Booking {
  id: number;
  className: string;
  date: string;
  time: string;
  trainer: string;
  status: string;
  attendance?: boolean;
}

interface BookingState {
  upcomingBookings: Booking[];
  pastBookings: Booking[];
  remainingSessions: number;
}

const UserBooking = () => {
  const [bookings, setBookings] = useState<BookingState>({
    upcomingBookings: [],
    pastBookings: [],
    remainingSessions: 0
  });
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      setIsLoading(true);
      
      try {
        // Convert user.id to UUID type for Supabase query
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('sessions_remaining, total_sessions')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // For now, until we have real data, we'll use mock data
        // In a real implementation, you would fetch bookings from Supabase
        const upcomingBookings = [
          { 
            id: 1, 
            className: "Morning Yoga", 
            date: "2025-05-01", 
            time: "08:00 AM", 
            trainer: "Jane Doe",
            status: "Confirmed"
          },
          { 
            id: 2, 
            className: "HIIT Workout", 
            date: "2025-05-03", 
            time: "10:00 AM", 
            trainer: "John Smith",
            status: "Confirmed"
          },
        ];
        
        const pastBookings = [
          { 
            id: 3, 
            className: "Strength Training", 
            date: "2025-04-27", 
            time: "02:00 PM", 
            trainer: "Alex Johnson",
            status: "Completed",
            attendance: true
          },
          { 
            id: 4, 
            className: "Pilates", 
            date: "2025-04-25", 
            time: "04:00 PM", 
            trainer: "Sarah Williams",
            status: "Completed",
            attendance: true
          },
          { 
            id: 5, 
            className: "Boxing", 
            date: "2025-04-22", 
            time: "06:00 PM", 
            trainer: "Mike Tyson",
            status: "Cancelled"
          },
        ];
        
        // Fix the type error by handling profileData properly with type checking and optional chaining
        let sessionsRemaining = 7; // Default value
        
        if (profileData && typeof profileData === 'object' && 'sessions_remaining' in profileData) {
          sessionsRemaining = profileData.sessions_remaining ?? 7;
        }
        
        setBookings({
          upcomingBookings,
          pastBookings,
          remainingSessions: sessionsRemaining
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error loading data",
          description: "Could not load your booking data. Please try again later.",
          variant: "destructive"
        });
        
        // Fallback to default values in case of error
        setBookings({
          upcomingBookings: [],
          pastBookings: [],
          remainingSessions: 7 // Default value
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, toast]);

  const handleCancelBooking = async (id: number) => {
    try {
      // In a real app, we would update the booking in Supabase
      // For now we'll just update the state
      
      setBookings({
        ...bookings,
        upcomingBookings: bookings.upcomingBookings.filter(
          (booking) => booking.id !== id
        ),
        remainingSessions: bookings.remainingSessions + 1
      });
      
      toast({
        title: "Booking cancelled",
        description: "Your booking has been successfully cancelled.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error cancelling booking",
        description: "Could not cancel your booking. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleBookingComplete = async () => {
    // In a real app, we would update the booking in Supabase
    // and refresh the bookings
    setBookings({
      ...bookings,
      remainingSessions: bookings.remainingSessions - 1
    });
    
    // Refresh the bookings list
    // For a real app, this would fetch the updated bookings
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
                        <div className="flex justify-between">
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
                            <span className="mr-3 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              {booking.status}
                            </span>
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-sm text-red-500 hover:text-red-700"
                            >
                              Cancel
                            </button>
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
                        <div className="flex justify-between">
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
                            {booking.status === "Completed" ? (
                              <div className="flex items-center">
                                {booking.attendance ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                )}
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                  {booking.status}
                                </span>
                              </div>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
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