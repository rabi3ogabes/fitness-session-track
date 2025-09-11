import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ClassModel } from "@/pages/admin/components/classes/ClassTypes";
import { isAfter, isSameDay } from "date-fns";
import useComingClass from "@/hooks/useComingClass";
import useIsNetworkConnected from "@/hooks/useIsNetworkConntected";

interface BookingFormProps {
  remainingSessions: number;
  onBookingComplete?: () => void;
}
interface ClassWithBooking extends ClassModel {
  type?: string;
  isBooked?: boolean;
}
const DEMO_CLASSES: ClassWithBooking[] = [
  {
    id: 1,
    name: "Yoga Basics",
    status: "Active",
    schedule: new Date(
      new Date().setDate(new Date().getDate() + 1)
    ).toISOString(),
    start_time: "09:00",
    end_time: "10:00",
    capacity: 20,
    enrolled: 8,
    trainer: "Jane Smith",
    location: "Studio 1",
    type: "yoga",
    isBooked: false,
  },
  {
    id: 2,
    name: "HIIT Workout",
    status: "Active",
    schedule: new Date(
      new Date().setDate(new Date().getDate() + 1)
    ).toISOString(),
    start_time: "11:00",
    end_time: "12:00",
    capacity: 15,
    enrolled: 12,
    trainer: "John Doe",
    location: "Gym Floor",
    type: "workout",
    isBooked: false,
  },
  {
    id: 3,
    name: "Boxing Fundamentals",
    status: "Active",
    schedule: new Date().toISOString(),
    start_time: "14:00",
    end_time: "15:30",
    capacity: 10,
    enrolled: 5,
    trainer: "Mike Tyson",
    location: "Boxing Ring",
    type: "combat",
    isBooked: true,
  },
  {
    id: 4,
    name: "Zumba Dance",
    status: "Active",
    schedule: new Date(
      new Date().setDate(new Date().getDate() + 2)
    ).toISOString(),
    start_time: "16:00",
    end_time: "17:00",
    capacity: 25,
    enrolled: 15,
    trainer: "Maria Lopez",
    location: "Dance Studio",
    type: "dance",
    isBooked: false,
  },
];
const BookingForm = ({
  remainingSessions,
  onBookingComplete,
}: BookingFormProps) => {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    fetchClasses,
    isLoading,
    error,
    setIsNetworkConnected,
    unbookedClasses,
    setError,
    setIsLoading,
    setAvailableClasses,
  } = useComingClass();

  useIsNetworkConnected(setIsNetworkConnected, fetchClasses);
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleBooking = async () => {
    if (!selectedClass) {
      toast({
        title: "No class selected",
        description: "Please select a class to book.",
        variant: "destructive",
      });
      return;
    }

    if (remainingSessions <= 0) {
      toast({
        title: "No sessions remaining",
        description: "Please purchase a membership to book more sessions.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book a session.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        class_id: selectedClass,
        status: "confirmed",
        booking_date: new Date().toISOString(),
      });

      if (error) throw error;

      // Decrement user's remaining sessions
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("sessions_remaining")
        .eq("id", user.id)
        .single();

      if (profileData && !profileError) {
        const newSessionsRemaining = Math.max(0, (profileData.sessions_remaining || 0) - 1);
        await supabase
          .from("profiles")
          .update({ sessions_remaining: newSessionsRemaining })
          .eq("id", user.id);
      } else {
        // Fallback: try to update members table using email
        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select("remaining_sessions")
          .eq("email", user.email)
          .single();

        if (memberData && !memberError) {
          const newRemainingSession = Math.max(0, (memberData.remaining_sessions || 0) - 1);
          await supabase
            .from("members")
            .update({ remaining_sessions: newRemainingSession })
            .eq("email", user.email);
        }
      }
      setAvailableClasses((prevClasses) =>
        prevClasses.map((cls) =>
          cls.id === selectedClass ? { ...cls, isBooked: true } : cls
        )
      );
      setSelectedClass(null);
      toast({
        title: "Booking successful!",
        description: "Your session has been booked.",
        variant: "default",
      });

      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (error) {
      console.error("Error booking class:", error);
      toast({
        title: "Booking failed",
        description:
          error.message || "There was an error booking your session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleRetry = () => {
    setError(null);
    fetchClasses();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Book a Session</h2>
      <p className="mb-4">
        You have{" "}
        <span className="font-bold text-gym-blue">{remainingSessions}</span>{" "}
        sessions remaining.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={handleRetry}
            className="text-sm bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded-md"
          >
            Retry
          </button>
        </div>
      )}
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Select a Class</label>
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-gym-blue border-t-transparent rounded-full"></div>
            </div>
          ) : unbookedClasses.length > 0 ? (
            unbookedClasses.slice(0, 4).map((cls) => (
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
                  <div
                    className={`p-3 rounded-md ${
                      selectedClass === cls.id
                        ? "bg-gym-light border-2 border-gym-blue"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">{cls.name}</span>
                      <div>
                        <span>{cls.start_time}</span> -
                        <span>{cls.end_time}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 flex justify-between">
                      <span>Trainer: {cls.trainer}</span>
                      <div>
                        <span>{cls.schedule}</span>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              No available classes found
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleBooking}
        disabled={!selectedClass || remainingSessions <= 0 || isLoading}
        className={`w-full py-2 px-4 rounded-md ${
          !selectedClass || remainingSessions <= 0 || isLoading
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
