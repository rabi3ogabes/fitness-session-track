
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BookingFormProps {
  remainingSessions: number;
  onBookingComplete?: () => void;
}

const availableClasses = [
  { id: 1, name: "Morning Yoga", time: "08:00 AM", trainer: "Jane Doe", date: "2025-05-01" },
  { id: 2, name: "HIIT Workout", time: "10:00 AM", trainer: "John Smith", date: "2025-05-01" },
  { id: 3, name: "Strength Training", time: "02:00 PM", trainer: "Alex Johnson", date: "2025-05-02" },
  { id: 4, name: "Pilates", time: "04:00 PM", trainer: "Sarah Williams", date: "2025-05-02" },
  { id: 5, name: "Boxing", time: "06:00 PM", trainer: "Mike Tyson", date: "2025-05-03" }
];

const BookingForm = ({ remainingSessions, onBookingComplete }: BookingFormProps) => {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const { toast } = useToast();

  const handleBooking = () => {
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

    toast({
      title: "Booking successful!",
      description: "Your session has been booked.",
      variant: "default"
    });

    if (onBookingComplete) {
      onBookingComplete();
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
          {availableClasses.map((cls) => (
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
          ))}
        </div>
      </div>

      <button
        onClick={handleBooking}
        disabled={remainingSessions <= 0}
        className={`w-full py-2 px-4 rounded-md ${
          remainingSessions <= 0
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gym-blue hover:bg-gym-dark-blue text-white"
        }`}
      >
        {remainingSessions <= 0 ? "No Sessions Available" : "Book Session"}
      </button>
    </div>
  );
};

export default BookingForm;
