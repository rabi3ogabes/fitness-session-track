
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import BookingForm from "@/components/BookingForm";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Define interfaces to improve type safety
interface ClassInfo {
  id?: number;
  name?: string;
  schedule?: string;
  start_time?: string;
  end_time?: string;
  trainer_id?: number;
  trainers?: {
    id?: number;
    name?: string;
  };
}

interface BookingData {
  id: string;
  class_id: number;
  user_id: string;
  status: string;
  attendance: boolean;
  created_at?: string;
  classes?: ClassInfo;
}

interface ProcessedBooking {
  id: string;
  className: string;
  date: string;
  time: string;
  trainer: string;
  status: string;
  attendance: boolean;
  classId?: number;
}

interface BookingState {
  upcomingBookings: ProcessedBooking[];
  pastBookings: ProcessedBooking[];
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
        // Get profile data for sessions remaining
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('sessions_remaining, total_sessions')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Get user's bookings with class and trainer info
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            class_id,
            user_id,
            status,
            attendance,
            classes:class_id(
              id,
              name,
              schedule,
              start_time,
              end_time,
              trainer_id,
              trainers:trainer_id(
                id,
                name
              )
            )
          `)
          .eq('user_id', user.id);
          
        if (bookingsError) throw bookingsError;
        
        console.log('Fetched real bookings from Supabase:', bookingsData);
        
        const currentDate = new Date();
        
        // Process and format the bookings
        const processedBookings: ProcessedBooking[] = bookingsData ? bookingsData.map((booking: BookingData) => {
          const classInfo = booking.classes;
          return {
            id: booking.id,
            className: classInfo?.name || "Unnamed Class",
            date: classInfo?.schedule || "",
            time: classInfo?.start_time || "",
            trainer: classInfo?.trainers?.name || "Unknown Trainer",
            status: booking.status || "Pending",
            attendance: booking.attendance || false,
            classId: classInfo?.id
          };
        }) : [];
        
        // Split into upcoming and past bookings
        const upcomingBookings = processedBookings.filter(booking => 
          new Date(booking.date) >= currentDate
        );
        
        const pastBookings = processedBookings.filter(booking => 
          new Date(booking.date) < currentDate
        );
        
        // Get sessions remaining from profile data
        let sessionsRemaining = 0;
        
        if (profileData && typeof profileData === 'object' && 'sessions_remaining' in profileData) {
          sessionsRemaining = profileData.sessions_remaining || 0;
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
        
        // Initialize with empty arrays, not demo data
        setBookings({
          upcomingBookings: [],
          pastBookings: [],
          remainingSessions: 0
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, toast]);

  const handleCancelBooking = async (id: string, classId?: number) => {
    if (!user || !id) return;
    
    try {
      // Cancel booking in Supabase
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'Cancelled' })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Also update the enrolled count for the class
      if (classId) {
        const { error: classError } = await supabase
          .from('classes')
          .select('enrolled')
          .eq('id', classId)
          .single();
          
        if (!classError) {
          await supabase.rpc('decrement_class_enrollment', { class_id: classId });
        }
      }
      
      // Update local state
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
    // Refresh the bookings after a new booking is made
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('sessions_remaining')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setBookings({
          ...bookings,
          remainingSessions: profileData.sessions_remaining || 0
        });
      }
      
      // Refresh the bookings list to show the new booking
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          class_id,
          user_id,
          status,
          attendance,
          classes:class_id(
            id,
            name,
            schedule,
            start_time,
            end_time,
            trainer_id,
            trainers:trainer_id(
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id);
        
      if (bookingsData) {
        const currentDate = new Date();
        
        // Process and format the bookings
        const processedBookings: ProcessedBooking[] = bookingsData.map((booking: BookingData) => {
          const classInfo = booking.classes;
          return {
            id: booking.id,
            className: classInfo?.name || "Unnamed Class",
            date: classInfo?.schedule || "",
            time: classInfo?.start_time || "",
            trainer: classInfo?.trainers?.name || "Unknown Trainer",
            status: booking.status || "Pending",
            attendance: booking.attendance || false,
            classId: classInfo?.id
          };
        });
        
        // Split into upcoming and past bookings
        const upcomingBookings = processedBookings.filter(booking => 
          new Date(booking.date) >= currentDate
        );
        
        const pastBookings = processedBookings.filter(booking => 
          new Date(booking.date) < currentDate
        );
        
        setBookings({
          ...bookings,
          upcomingBookings,
          pastBookings
        });
      }
    }
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
                              onClick={() => handleCancelBooking(booking.id, booking.classId)}
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
