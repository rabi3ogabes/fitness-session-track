
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { format, isSameDay, addMonths, subMonths, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { mockClasses, isDayWithClass, getClassesForDate } from "../mockData";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface CalendarSectionProps {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  bookings: any[];
  handleViewClassDetails: (classId: number) => void;
}

export const CalendarSection = ({ 
  selectedDate, 
  setSelectedDate,
  bookings,
  handleViewClassDetails
}: CalendarSectionProps) => {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(selectedDate));
  const classesForView = getClassesForDate(selectedDate);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isClassAlreadyBooked, setIsClassAlreadyBooked] = useState(false);
  const { toast } = useToast();
  
  // Calendar navigation handlers
  const handlePreviousMonth = () => {
    setCalendarDate(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    setCalendarDate(prev => addMonths(prev, 1));
  };
  
  // Get dates with classes for the month indicator
  const daysWithClasses = mockClasses.reduce((acc, cls) => {
    const classDate = typeof cls.date === 'string' ? parseISO(cls.date) : cls.date;
    const dateKey = format(classDate, 'yyyy-MM-dd');
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    
    acc[dateKey].push(cls);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Generate calendar data
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    const startDate = monthStart;
    const endDate = monthEnd;
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const startDay = getDay(monthStart);
    
    // Add empty cells for days before the start of month
    const prevMonthDays = Array(startDay).fill(null);
    
    // Calculate days needed to complete the last row
    const daysAfter = (7 - ((days.length + startDay) % 7)) % 7;
    const nextMonthDays = Array(daysAfter).fill(null);
    
    return { prevMonthDays, currentMonthDays: days, nextMonthDays };
  };
  
  const { prevMonthDays, currentMonthDays, nextMonthDays } = generateCalendarDays();

  const handleClassClick = (classId: number) => {
    // Check if class is already booked
    const isBooked = bookings.some(booking => booking.class_id === classId);
    setSelectedClassId(classId);
    setIsClassAlreadyBooked(isBooked);
    setBookingDialogOpen(true);
  };

  const handleBookClass = () => {
    if (isClassAlreadyBooked) {
      toast({
        title: "Already booked",
        description: "You have already booked this class.",
        variant: "destructive"
      });
      setBookingDialogOpen(false);
      return;
    }
    
    handleViewClassDetails(selectedClassId as number);
    setBookingDialogOpen(false);
  };

  const handleCancelBooking = () => {
    // Handle cancellation logic here
    toast({
      title: "Booking cancelled",
      description: "Your booking has been cancelled successfully.",
      variant: "default"
    });
    setBookingDialogOpen(false);
  };
  
  return (
    <div className="w-full">
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-purple-500" />
              Class Schedule
            </div>
            <div className="text-sm font-normal text-gray-500">
              {format(selectedDate, "MMM d, yyyy")}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="bg-white rounded-lg border p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                className="text-gray-500"
              >
                &lt;
              </Button>
              <h3 className="font-medium text-center">
                {format(calendarDate, "MMMM yyyy")}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="text-gray-500"
              >
                &gt;
              </Button>
            </div>
            
            {/* Calendar header - days of week */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, i) => (
                <div key={i} className="text-xs font-medium text-gray-500 h-8 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Previous month filler days */}
              {prevMonthDays.map((_, index) => (
                <div 
                  key={`prev-${index}`} 
                  className="h-10 p-1 text-center text-gray-300"
                >
                  <div className="w-full h-full rounded-md flex items-center justify-center">
                    {/* Empty cell */}
                  </div>
                </div>
              ))}
              
              {/* Current month days */}
              {currentMonthDays.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const hasClasses = daysWithClasses[dateKey];
                const classCount = hasClasses ? hasClasses.length : 0;
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                
                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "h-10 p-0.5 cursor-pointer",
                      isToday && "font-bold",
                      isSelected && "bg-purple-50 rounded-md"
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="flex items-center justify-center h-full">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        isSelected ? "bg-purple-500 text-white" : "",
                        isToday && !isSelected ? "border border-purple-500" : ""
                      )}>
                        {format(day, "d")}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Next month filler days */}
              {nextMonthDays.map((_, index) => (
                <div 
                  key={`next-${index}`} 
                  className="h-10 p-1 text-center text-gray-300"
                >
                  <div className="w-full h-full rounded-md flex items-center justify-center">
                    {/* Empty cell */}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-purple-500" />
              Classes on {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            
            <div className="space-y-3">
              {classesForView.length > 0 ? (
                classesForView.map(cls => {
                  const isBooked = bookings.some(booking => booking.class_id === cls.id);
                  
                  return (
                    <div 
                      key={cls.id} 
                      className="bg-gray-50 p-3 rounded-md border-l-4 border-purple-500 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleClassClick(cls.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {cls.time}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isBooked && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              Booked
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-white">
                            {cls.enrolled}/{cls.capacity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500 text-center py-6 bg-gray-50 rounded-md border border-dashed border-gray-300">
                  <p>No classes scheduled</p>
                  <p className="text-xs mt-1">Select another date</p>
                </div>
              )}
            </div>
          </div>

          {/* Class Booking Dialog */}
          <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isClassAlreadyBooked ? "Cancel Booking" : "Book Class"}
                </DialogTitle>
                <DialogDescription>
                  {isClassAlreadyBooked 
                    ? "You have already booked this class. Would you like to cancel your booking?" 
                    : "Confirm your class booking"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <DialogFooter className="sm:justify-start">
                {isClassAlreadyBooked ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                      Keep Booking
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleCancelBooking}>
                      Cancel Booking
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" variant="default" onClick={handleBookClass}>
                      Confirm Booking
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

