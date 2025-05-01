
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, User, X } from "lucide-react";
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

  // Helper function to get class data
  const getClassData = () => {
    if (!selectedClass) return null;
    return mockClasses.find(c => c.id === selectedClass);
  };

  const cls = getClassData();
  const classBookings = selectedClass ? getBookingsForClass(selectedClass) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        {cls ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{cls.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <div>{format(cls.date, "EEEE, MMMM d, yyyy")}</div>
                <div>•</div>
                <div>{cls.time}</div>
                <div>•</div>
                <div>{cls.enrolled}/{cls.capacity} enrolled</div>
              </div>
            </DialogHeader>
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Attendees</h3>
                <div className="text-sm text-muted-foreground">
                  {classBookings.filter(b => b.status === "Present").length} present / {classBookings.length} total
                </div>
              </div>
              
              {classBookings.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {classBookings.map(booking => (
                        <tr key={booking.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{booking.member}</div>
                                <div className="text-xs text-gray-500">Member since 2023</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
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
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {booking.status === "Present" ? (
                              <Badge className="bg-green-100 text-green-800">Present</Badge>
                            ) : booking.status === "Absent" ? (
                              <Badge className="bg-red-100 text-red-800">Absent</Badge>
                            ) : (
                              <div className="flex justify-center space-x-2">
                                <Button 
                                  size="sm" 
                                  className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600"
                                  variant="default"
                                  onClick={() => handleMarkAttendance(booking.id, true)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600"
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
                <div className="text-center py-8 bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">No members enrolled yet</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <p>Class data not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
