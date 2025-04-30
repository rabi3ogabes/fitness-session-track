
import { format, addDays } from "date-fns";

// Mock bookings data
export const mockBookings = [
  { id: 1, member: "Sarah Johnson", class: "Morning Yoga", date: "2025-05-01", time: "7:00 AM", status: "Confirmed" },
  { id: 2, member: "Michael Brown", class: "HIIT Workout", date: "2025-05-01", time: "6:00 PM", status: "Confirmed" },
  { id: 3, member: "Emma Wilson", class: "Strength Training", date: "2025-05-02", time: "5:00 PM", status: "Confirmed" },
  { id: 4, member: "James Martinez", class: "Pilates", date: "2025-05-02", time: "9:00 AM", status: "Confirmed" },
  { id: 5, member: "William Harris", class: "HIIT Workout", date: "2025-04-30", time: "6:00 PM", status: "Completed" },
  { id: 6, member: "Linda Rodriguez", class: "Morning Yoga", date: "2025-05-01", time: "7:00 AM", status: "Confirmed" },
  { id: 7, member: "Thomas Wilson", class: "HIIT Workout", date: "2025-05-01", time: "6:00 PM", status: "Confirmed" },
  { id: 8, member: "Olivia Smith", class: "Strength Training", date: "2025-05-02", time: "5:00 PM", status: "Confirmed" },
  { id: 9, member: "David Lee", class: "Morning Yoga", date: "2025-05-03", time: "7:00 AM", status: "Confirmed" },
  { id: 10, member: "Jennifer Taylor", class: "HIIT Workout", date: "2025-05-03", time: "6:00 PM", status: "Confirmed" },
  { id: 11, member: "Robert Johnson", class: "Pilates", date: "2025-05-02", time: "9:00 AM", status: "Confirmed" },
  { id: 12, member: "Mary Brown", class: "Morning Yoga", date: "2025-05-03", time: "7:00 AM", status: "Confirmed" },
];

// Mock classes data
export const mockClasses = [
  { id: 1, name: "Morning Yoga", date: new Date(2025, 4, 1), time: "7:00 AM - 8:00 AM", capacity: 15, enrolled: 8, trainer: "Jane Smith" },
  { id: 2, name: "HIIT Workout", date: new Date(2025, 4, 1), time: "6:00 PM - 7:00 PM", capacity: 12, enrolled: 10, trainer: "Mike Johnson" },
  { id: 3, name: "Strength Training", date: new Date(2025, 4, 2), time: "5:00 PM - 6:00 PM", capacity: 10, enrolled: 5, trainer: "Sarah Davis" },
  { id: 4, name: "Pilates", date: new Date(2025, 4, 2), time: "9:00 AM - 10:00 AM", capacity: 8, enrolled: 6, trainer: "Emma Wilson" },
  { id: 5, name: "Boxing", date: new Date(2025, 4, 4), time: "6:00 PM - 7:00 PM", capacity: 8, enrolled: 7, trainer: "Mike Tyson" },
  { id: 6, name: "Morning Yoga", date: new Date(2025, 4, 3), time: "7:00 AM - 8:00 AM", capacity: 15, enrolled: 9, trainer: "Jane Smith" },
  { id: 7, name: "HIIT Workout", date: new Date(2025, 4, 3), time: "6:00 PM - 7:00 PM", capacity: 12, enrolled: 8, trainer: "Mike Johnson" },
];

// Mock membership plans for new member registration
export const membershipPlans = [
  { id: 1, name: "Basic", price: 250, sessions: 12 },
  { id: 2, name: "Premium", price: 350, sessions: 20 },
  { id: 3, name: "Ultimate", price: 500, sessions: 30 }
];

// Helper function to get bookings for a specific class
export const getBookingsForClass = (classId: number) => {
  const selectedClass = mockClasses.find(c => c.id === classId);
  if (!selectedClass) return [];
  
  const formattedDate = format(selectedClass.date, "yyyy-MM-dd");
  const timeStartPart = selectedClass.time.split('-')[0].trim();
  
  return mockBookings.filter(booking => 
    booking.date === formattedDate && 
    booking.class === selectedClass.name &&
    booking.time === timeStartPart
  );
};

// Helper to check if a date has classes
export const isDayWithClass = (date: Date) => {
  return mockClasses.some(cls => 
    cls.date.getDate() === date.getDate() &&
    cls.date.getMonth() === date.getMonth() &&
    cls.date.getFullYear() === date.getFullYear()
  );
};

// Get filtered classes based on view mode and date
export const getFilteredClasses = (viewMode: "today" | "tomorrow" | "all", selectedDate: Date) => {
  const tomorrow = addDays(new Date(), 1);
  
  if (viewMode === "today") {
    return mockClasses.filter(cls => 
      cls.date.getDate() === new Date().getDate() &&
      cls.date.getMonth() === new Date().getMonth() &&
      cls.date.getFullYear() === new Date().getFullYear()
    );
  } else if (viewMode === "tomorrow") {
    return mockClasses.filter(cls => 
      cls.date.getDate() === tomorrow.getDate() &&
      cls.date.getMonth() === tomorrow.getMonth() &&
      cls.date.getFullYear() === tomorrow.getFullYear()
    );
  } else {
    return mockClasses.filter(cls => 
      cls.date.getDate() === selectedDate.getDate() &&
      cls.date.getMonth() === selectedDate.getMonth() &&
      cls.date.getFullYear() === selectedDate.getFullYear()
    );
  }
};

// Get classes for a specific date
export const getClassesForDate = (selectedDate: Date) => {
  return mockClasses.filter(cls => 
    cls.date.getDate() === selectedDate.getDate() &&
    cls.date.getMonth() === selectedDate.getMonth() &&
    cls.date.getFullYear() === selectedDate.getFullYear()
  );
};
