import { useState } from "react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isWithinInterval } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarSectionProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  bookings: any[];
  handleViewClassDetails: (classId: number) => void;
}

export function CalendarSection({ selectedDate, setSelectedDate, bookings, handleViewClassDetails }: CalendarSectionProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const handlePrevDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(nextDate => addDays(nextDate, 1));
  };

  const handlePrevWeek = () => {
    const newDate = addDays(selectedDate, -7);
    setSelectedDate(newDate);
    setCurrentMonth(newDate);
  };

  const handleNextWeek = () => {
    const newDate = addDays(selectedDate, 7);
    setSelectedDate(newDate);
    setCurrentMonth(newDate);
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const generateWeek = (start: Date): Date[] => {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(addDays(start, i));
    }
    return week;
  };

  const start = startOfWeek(currentMonth, { weekStartsOn: 0 });
  const end = endOfWeek(currentMonth, { weekStartsOn: 0 });

  const week = generateWeek(start);

  const bookingsForSelectedDate = bookings.filter(booking => {
    const bookingDate = booking.date || booking.booking_date;
    if (!bookingDate) return false;
    
    const formattedBookingDate = format(new Date(bookingDate), 'yyyy-MM-dd');
    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
    
    return formattedBookingDate === formattedSelectedDate;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-200 rounded">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {format(selectedDate, "MMMM dd, yyyy")}
        </h2>
        <button onClick={handleNextWeek} className="p-2 hover:bg-gray-200 rounded">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {week.map((day) => (
          <div
            key={day.toISOString()}
            className={`text-center py-2 rounded-lg cursor-pointer ${
              isSameDay(day, selectedDate) ? 'bg-gym-blue text-white' : 'hover:bg-gray-100'
            }`}
            onClick={() => handleDateClick(day)}
          >
            {format(day, "EEE dd")}
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-md font-semibold mb-2">
          Classes for {format(selectedDate, "MMMM dd")}
        </h3>
        {bookingsForSelectedDate.length === 0 ? (
          <p>No classes scheduled for this day.</p>
        ) : (
          bookingsForSelectedDate.map((booking) => {
            const className = booking.class || (booking.classes ? booking.classes.name : "Unknown Class");
            const classTime = booking.time || (booking.classes ? booking.classes.time : "N/A");
            
            return (
              <div key={booking.id} className="mb-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow">
                  <div>
                    <h4 className="font-medium">{booking.member || "Member"}</h4>
                    <p className="text-sm text-gray-500">{className} at {classTime}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                      {booking.status || "Status"}
                    </span>
                    <button
                      onClick={() => handleViewClassDetails(booking.id)}
                      className="px-4 py-2 bg-gym-blue text-white rounded hover:bg-gym-dark-blue text-xs"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
