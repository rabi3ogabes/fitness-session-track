
import { mockBookings } from "../mockData";
import { useToast } from "@/hooks/use-toast";

// Define interfaces for type safety
interface Booking {
  id: number;
  status: string;
  member: string;
  class: string;
}

type BookingArray = typeof mockBookings;

// Function to mark attendance for a booking
export const useAttendanceManager = () => {
  const { toast } = useToast();
  
  const markAttendance = (bookingId: number, present: boolean, bookings: BookingArray, setBookings: React.Dispatch<React.SetStateAction<BookingArray>>) => {
    // In a real app, this would call an API
    const newStatus = present ? "Present" : "Absent";
    
    // Update the local state for UI feedback
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus } 
          : booking
      )
    );
    
    const booking = bookings.find(b => b.id === bookingId);
    
    toast({
      title: `Attendance marked: ${newStatus}`,
      description: `${booking?.member} has been marked as ${newStatus.toLowerCase()} for ${booking?.class}`,
    });
  };

  return { markAttendance };
};
