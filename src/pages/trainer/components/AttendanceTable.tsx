
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { mockBookings } from "../mockData";
import { useAttendanceManager } from "../utils/attendanceUtils";

interface AttendanceTableProps {
  bookings: typeof mockBookings;
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
}

export const AttendanceTable = ({ 
  bookings, 
  selectedDate, 
  setSelectedDate 
}: AttendanceTableProps) => {
  const [localBookings, setLocalBookings] = useState<typeof mockBookings>(mockBookings);
  const { markAttendance } = useAttendanceManager();
  
  const handleMarkAttendance = (bookingId: number, present: boolean) => {
    markAttendance(bookingId, present, localBookings, setLocalBookings);
  };
  
  return (
    <>
      {bookings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{booking.member}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{booking.class}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{booking.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {booking.status === "Completed" || booking.status === "Present" ? (
                      <Badge className="bg-green-100 text-green-800">Present</Badge>
                    ) : booking.status === "Absent" ? (
                      <Badge className="bg-red-100 text-red-800">Absent</Badge>
                    ) : (
                      <div className="flex justify-center space-x-1">
                        <Button 
                          size="sm" 
                          className="h-8 bg-green-500 hover:bg-green-600"
                          variant="default"
                          onClick={() => handleMarkAttendance(booking.id, true)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-8 bg-red-500 hover:bg-red-600"
                          variant="default"
                          onClick={() => handleMarkAttendance(booking.id, false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <p className="mb-2">No bookings for {format(selectedDate, "MMMM d, yyyy")}</p>
          <Button onClick={() => setSelectedDate(new Date())} variant="outline">
            View Today's Bookings
          </Button>
        </div>
      )}
    </>
  );
};
