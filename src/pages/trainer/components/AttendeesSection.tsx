
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { format, addDays, isToday, compareAsc } from "date-fns";
import { cn } from "@/lib/utils";
import { mockClasses, getBookingsForClass, getClassesForDate } from "../mockData";
import { useAttendanceManager } from "../utils/attendanceUtils";
import { mockBookings } from "../mockData";
import { useState } from "react";
import { BulkAttendanceDialog } from "./BulkAttendanceDialog";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

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
  const [isBulkAttendanceOpen, setIsBulkAttendanceOpen] = useState(false);
  
  // Get upcoming classes for multiple days
  const getUpcomingClasses = () => {
    const result = [];
    const today = new Date();
    
    // Get classes for today and the next 6 days (week view)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const classesForDay = getClassesForDate(date);
      if (classesForDay.length > 0) {
        result.push({
          date,
          classes: classesForDay
        });
      }
    }
    
    return result;
  };
  
  const upcomingClasses = getUpcomingClasses();
  const classesForAttendees = getClassesForDate(selectedDateForAttendees);
  
  const handleOpenBulkAttendance = () => {
    if (selectedClassForAttendees) {
      setIsBulkAttendanceOpen(true);
    }
  };
  
  // Function to determine if a date is today
  const isDateToday = (date: Date) => {
    return isToday(date);
  }
  
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
        
        {/* Upcoming Classes Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Upcoming Classes</h3>
          <div className="space-y-6">
            {upcomingClasses.map((dayClasses) => (
              <div key={format(dayClasses.date, 'yyyy-MM-dd')} className="space-y-3">
                <h4 className={cn(
                  "text-base font-medium flex items-center",
                  isDateToday(dayClasses.date) ? "text-gym-blue" : ""
                )}>
                  {isDateToday(dayClasses.date) ? (
                    <Badge variant="outline" className="mr-2 bg-gym-light text-gym-blue">Today</Badge>
                  ) : null}
                  {format(dayClasses.date, "EEEE, MMMM d")}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {dayClasses.classes.map(cls => {
                    const isSelected = cls.id === selectedClassForAttendees && 
                                      isSameDay(dayClasses.date, selectedDateForAttendees);
                    const percentFull = (cls.enrolled / cls.capacity) * 100;
                    
                    return (
                      <Card 
                        key={cls.id} 
                        className={cn(
                          "cursor-pointer transition-all border-2",
                          isSelected ? "border-gym-blue bg-gym-light" : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => {
                          setSelectedClassForAttendees(cls.id);
                          setSelectedDateForAttendees(dayClasses.date);
                        }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-base">{cls.name}</h4>
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
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-gray-500">{cls.time}</p>
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
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {upcomingClasses.length === 0 && (
              <div className="text-center py-8 border rounded-md">
                <p className="text-gray-500">No upcoming classes scheduled</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Selected class details */}
        {selectedClassForAttendees && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">
                Selected Class
                {(() => {
                  const cls = mockClasses.find(c => c.id === selectedClassForAttendees);
                  return cls ? ` - ${cls.name} (${cls.time})` : '';
                })()}
              </h3>
              <Button 
                onClick={handleOpenBulkAttendance}
                className="bg-gym-blue hover:bg-gym-dark-blue"
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" /> Manage Attendance
              </Button>
            </div>
            
            {(() => {
              const classBookings = getBookingsForClass(selectedClassForAttendees);
              const cls = mockClasses.find(c => c.id === selectedClassForAttendees);
              
              return (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{cls?.name}</h4>
                        <p className="text-sm text-gray-500">{format(selectedDateForAttendees, "EEEE, MMMM d")} at {cls?.time}</p>
                      </div>
                      <Badge>{classBookings.length} Members</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {classBookings.map(booking => (
                        <div 
                          key={booking.id} 
                          className="p-2 border rounded-md flex justify-between items-center"
                        >
                          <span className="font-medium">{booking.member}</span>
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
                        </div>
                      ))}
                      
                      {classBookings.length === 0 && (
                        <div className="col-span-2 text-center py-4 text-gray-500">
                          No members enrolled in this class
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleOpenBulkAttendance} 
                      className="w-full bg-gym-blue hover:bg-gym-dark-blue"
                    >
                      <Users className="h-4 w-4 mr-2" /> Manage Attendance
                    </Button>
                  </CardFooter>
                </Card>
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
      
      {/* Bulk Attendance Dialog */}
      <BulkAttendanceDialog
        isOpen={isBulkAttendanceOpen}
        onOpenChange={setIsBulkAttendanceOpen}
        selectedClass={selectedClassForAttendees}
        selectedDate={selectedDateForAttendees}
      />
    </div>
  );
};

// Helper function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}
