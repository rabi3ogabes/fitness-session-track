
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface BookingFormProps {
  remainingSessions: number;
  onBookingComplete?: () => void;
}

const BookingForm = ({ remainingSessions, onBookingComplete }: BookingFormProps) => {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch available classes
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      
      // In a real app with a database, you would fetch classes from the database
      // For now, we'll use the mock data
      const mockClasses = [
        { id: 1, name: "Morning Yoga", time: "08:00 AM", trainer: "Jane Doe", date: "2025-05-01" },
        { id: 2, name: "HIIT Workout", time: "10:00 AM", trainer: "John Smith", date: "2025-05-01" },
        { id: 3, name: "Strength Training", time: "02:00 PM", trainer: "Alex Johnson", date: "2025-05-02" },
        { id: 4, name: "Pilates", time: "04:00 PM", trainer: "Sarah Williams", date: "2025-05-02" },
        { id: 5, name: "Boxing", time: "06:00 PM", trainer: "Mike Tyson", date: "2025-05-03" }
      ];

      setAvailableClasses(mockClasses);
      setIsLoading(false);
    };

    fetchClasses();
  }, []);

  const handleBooking = async () => {
    if (remainingSessions <= 0) {
      toast({
        title: "No sessions remaining",
        description: "Please purchase a membership to book more sessions.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedClass) {
      toast({
        title: "No class selected",
        description: "Please select a class to book.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book a session.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Insert booking into database - Fix the type error by providing a single object, not an array
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          class_id: selectedClass,
          status: 'confirmed'
        });
      
      if (error) throw error;
      
      // Update user's remaining sessions (in a real app)
      // For now we'll just call the onBookingComplete callback
      
      toast({
        title: "Booking successful!",
        description: "Your session has been booked.",
        variant: "default"
      });

      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (error: any) {
      console.error("Error booking class:", error);
      toast({
        title: "Booking failed",
        description: error.message || "There was an error booking your session.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Book a Session</h2>
      <p className="mb-4">
        You have <span className="font-bold text-gym-blue">{remainingSessions}</span> sessions remaining.
      </p>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Select a Class</label>
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-gym-blue border-t-transparent rounded-full"></div>
            </div>
          ) : (
            availableClasses.map((cls) => (
              <div key={cls.id} className="flex items-center">
                <input
                  type="radio"
                  id={`class-${cls.id}`}
                  name="class"
                  checked={selectedClass === cls.id}
                  onChange={() => setSelectedClass(cls.id)}
                  className="mr-2"
                />
                <label htmlFor={`class-${cls.id}`} className="flex-1">
                  <div className={`p-3 rounded-md ${selectedClass === cls.id ? 'bg-gym-light border-2 border-gym-blue' : 'bg-gray-50'}`}>
                    <div className="flex justify-between">
                      <span className="font-semibold">{cls.name}</span>
                      <span>{cls.time}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span>{cls.date}</span> • <span>Trainer: {cls.trainer}</span>
                    </div>
                  </div>
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={handleBooking}
        disabled={remainingSessions <= 0 || isLoading}
        className={`w-full py-2 px-4 rounded-md ${
          remainingSessions <= 0 || isLoading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gym-blue hover:bg-gym-dark-blue text-white"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
            Booking...
          </span>
        ) : remainingSessions <= 0 ? (
          "No Sessions Available"
        ) : (
          "Book Session"
        )}
      </button>
    </div>
  );
};

export default BookingForm;
