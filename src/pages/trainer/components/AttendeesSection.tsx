
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { mockClasses, getBookingsForClass, getClassesForDate } from "../mockData";
import { useAttendanceManager } from "../utils/attendanceUtils";
import { mockBookings } from "../mockData";
import { useState } from "react";

interface AttendeesSectionProps {
  selectedDateForAttendees: Date;
  setSelectedDateForAttendees: React.Dispatch<React.SetStateAction<Date>>;
  selectedClassForAttendees: number | null;
  setSelectedClassForAttendees: React.Dispatch<React.SetStateAction<number | null>>;
}

export const AttendeesSection = ({ 
  selectedDateForAttendees, 
  setSelectedDateForAttendees,
  selectedClassForAttendees,
  setSelectedClassForAttendees
}: AttendeesSectionProps) => {
  const [bookings, setBookings] = useState(mockBookings);
  const { markAttendance } = useAttendanceManager();
  
  const classesForAttendees = getClassesForDate(selectedDateForAttendees);
  
  const handleMarkAttendance = (bookingId: number, present: boolean) => {
    markAttendance(bookingId, present, bookings, setBookings);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold">Class Attendees</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <Button variant="outline" size="icon" onClick={() => setSelectedDateForAttendees(prev => addDays(prev, -1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-medium">
                {format(selectedDateForAttendees, "MMMM d, yyyy")}
              </div>
              <Button variant="outline" size="icon" onClick={() => setSelectedDateForAttendees(prev => addDays(prev, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Classes displayed as boxes */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Available Classes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {classesForAttendees.length > 0 ? (
              classesForAttendees.map(cls => {
                const isSelected = cls.id === selectedClassForAttendees;
                const percentFull = (cls.enrolled / cls.capacity) * 100;
                
                return (
                  <div 
                    key={cls.id} 
                    className={cn(
                      "p-4 rounded-md border-2 cursor-pointer transition-all",
                      isSelected ? "border-gym-blue bg-gym-light" : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setSelectedClassForAttendees(cls.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{cls.name}</h4>
                      <Badge 
                        className={cn(
                          percentFull >= 90 ? "bg-red-100 text-red-800" : 
                          percentFull >= 70 ? "bg-amber-100 text-amber-800" : 
                          "bg-green-100 text-green-800"
                        )}
                      >
                        {cls.enrolled}/{cls.capacity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{cls.time}</p>
                    <p className="text-xs text-gray-500">Trainer: {cls.trainer}</p>
                    
                    <div className="mt-3 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full",
                          percentFull >= 90 ? "bg-red-500" : 
                          percentFull >= 70 ? "bg-amber-500" : 
                          "bg-green-500"
                        )}
                        style={{ width: `${percentFull}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-6 text-gray-500">
                <p>No classes scheduled for {format(selectedDateForAttendees, "MMMM d, yyyy")}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Attendees list */}
        {selectedClassForAttendees && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">
                Attendees List
                {(() => {
                  const cls = mockClasses.find(c => c.id === selectedClassForAttendees);
                  return cls ? ` - ${cls.name} (${cls.time})` : '';
                })()}
              </h3>
              <Badge variant="outline">
                {(() => {
                  const cls = mockClasses.find(c => c.id === selectedClassForAttendees);
                  return cls ? `${cls.enrolled}/${cls.capacity}` : '';
                })()}
              </Badge>
            </div>
            
            {(() => {
              const classBookings = getBookingsForClass(selectedClassForAttendees);
              
              return classBookings.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Attendance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classBookings.map(booking => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.member}</TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-right">
                            {booking.status === "Completed" || booking.status === "Present" ? (
                              <Badge className="bg-green-100 text-green-800">Present</Badge>
                            ) : booking.status === "Absent" ? (
                              <Badge className="bg-red-100 text-red-800">Absent</Badge>
                            ) : (
                              <div className="flex justify-end space-x-1">
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-gray-500">No attendees for this class</p>
                </div>
              );
            })()}
          </div>
        )}
        
        {!selectedClassForAttendees && (
          <div className="border rounded-md text-center py-8 text-gray-500">
            <p>Select a class to view attendees</p>
          </div>
        )}
      </div>
    </div>
  );
};
