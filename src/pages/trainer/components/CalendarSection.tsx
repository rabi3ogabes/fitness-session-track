
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock, UsersRound } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { mockClasses, mockBookings, isDayWithClass, getClassesForDate } from "../mockData";
import { AttendanceTable } from "./AttendanceTable";

interface CalendarSectionProps {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  bookings: typeof mockBookings;
  handleViewClassDetails: (classId: number) => void;
}

export const CalendarSection = ({ 
  selectedDate, 
  setSelectedDate,
  bookings,
  handleViewClassDetails
}: CalendarSectionProps) => {
  const [todaysBookings, setTodaysBookings] = useState<typeof mockBookings>([]);
  
  useEffect(() => {
    // Filter bookings for the selected date
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const filtered = bookings.filter(booking => booking.date === formattedDate);
    setTodaysBookings(filtered);
  }, [selectedDate, bookings]);
  
  const classesForView = getClassesForDate(selectedDate);
  
  const attendanceStats = {
    total: todaysBookings.length,
    pending: todaysBookings.filter(b => b.status === "Confirmed").length
  };
  
  // Custom day content renderer for the calendar
  const DayContent = (props: any) => {
    const { date, ...otherProps } = props;
    
    // Check if there are classes on this day
    const hasClasses = mockClasses.some(cls => 
      cls.date.getDate() === date.getDate() &&
      cls.date.getMonth() === date.getMonth() &&
      cls.date.getFullYear() === date.getFullYear()
    );
    
    return (
      <div className="flex flex-col items-center">
        <div {...otherProps} />
        {hasClasses && (
          <div className="w-1 h-1 bg-gym-blue rounded-full mt-0.5" />
        )}
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5 text-gym-blue" />
            Class Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Calendar 
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="pointer-events-auto w-full bg-white"
            modifiers={{
              hasClass: isDayWithClass
            }}
            modifiersClassNames={{
              hasClass: "bg-gym-light text-gym-blue font-bold"
            }}
            components={{
              DayContent: DayContent,
            }}
          />
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">
              Classes on {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            
            {classesForView.length > 0 ? (
              <div className="space-y-2">
                {classesForView.map(cls => (
                  <div key={cls.id} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{cls.name}</p>
                        <p className="text-xs text-gray-500">{cls.time}</p>
                      </div>
                      <Badge variant="outline">
                        {cls.enrolled}/{cls.capacity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-2">No classes scheduled</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              <UsersRound className="mr-2 h-5 w-5 text-gym-blue" />
              Attendance Management
            </CardTitle>
            <div className="text-sm">
              <span className="font-medium">{attendanceStats.total}</span> Bookings | 
              <span className="text-yellow-600 font-medium ml-1">{attendanceStats.pending}</span> Pending
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <AttendanceTable 
            bookings={todaysBookings}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </CardContent>
      </Card>
      
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="mr-2 h-5 w-5 text-gym-blue" />
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockClasses.filter(cls => cls.date > new Date()).slice(0, 3).map(cls => (
              <div key={cls.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="font-medium text-lg">{cls.name}</h3>
                <p className="text-sm text-gray-500">{format(cls.date, "MMMM d, yyyy")}</p>
                <p className="text-sm text-gray-500">{cls.time}</p>
                <div className="mt-3 flex justify-between items-center">
                  <Badge variant="outline" className="bg-white">
                    {cls.enrolled}/{cls.capacity} enrolled
                  </Badge>
                  <Button 
                    size="sm" 
                    className="bg-gym-blue hover:bg-gym-dark-blue"
                    onClick={() => handleViewClassDetails(cls.id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
