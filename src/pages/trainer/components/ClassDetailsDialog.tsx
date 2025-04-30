
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { mockClasses, getBookingsForClass } from "../mockData";
import { useAttendanceManager } from "../utils/attendanceUtils";
import { mockBookings } from "../mockData";
import { useState } from "react";

interface ClassDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass: number | null;
}

export const ClassDetailsDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedClass 
}: ClassDetailsDialogProps) => {
  const [bookings, setBookings] = useState(mockBookings);
  const { markAttendance } = useAttendanceManager();
  
  const handleMarkAttendance = (bookingId: number, present: boolean) => {
    markAttendance(bookingId, present, bookings, setBookings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        {selectedClass && (() => {
          const cls = mockClasses.find(c => c.id === selectedClass);
          const classBookings = getBookingsForClass(selectedClass);
          
          if (!cls) return <p>Class not found</p>;
          
          return (
            <>
              <DialogHeader>
                <DialogTitle>{cls.name} - {format(cls.date, "MMMM d, yyyy")}</DialogTitle>
                <DialogDescription>
                  {cls.time} • {cls.enrolled}/{cls.capacity} enrolled
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Enrolled Members</h4>
                
                {classBookings.length > 0 ? (
                  <div className="border rounded-md max-h-[300px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {classBookings.map(booking => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {booking.member}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              <span
                                className={cn(
                                  "px-2 py-1 text-xs rounded-full",
                                  {
                                    "bg-green-100 text-green-800": booking.status === "Confirmed" || booking.status === "Present",
                                    "bg-red-100 text-red-800": booking.status === "Absent",
                                    "bg-yellow-100 text-yellow-800": booking.status === "Pending",
                                  }
                                )}
                              >
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-center">
                              {booking.status === "Completed" || booking.status === "Present" ? (
                                <Badge className="bg-green-100 text-green-800">Present</Badge>
                              ) : booking.status === "Absent" ? (
                                <Badge className="bg-red-100 text-red-800">Absent</Badge>
                              ) : (
                                <div className="flex justify-center space-x-1">
                                  <Button 
                                    size="sm" 
                                    className="h-7 w-7 p-0 bg-green-500 hover:bg-green-600"
                                    variant="default"
                                    onClick={() => handleMarkAttendance(booking.id, true)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="h-7 w-7 p-0 bg-red-500 hover:bg-red-600"
                                    variant="default"
                                    onClick={() => handleMarkAttendance(booking.id, false)}
                                  >
                                    <X className="h-3 w-3" />
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
                  <p className="text-center py-4 text-gray-500">No members enrolled yet</p>
                )}
              </div>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
};
