import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { format, isSameDay, addMonths, subMonths, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { mockClasses, getClassesForDate } from "../mockData";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast"; // Changed import path
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CalendarSectionProps {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  bookings: any[]; // This seems to be mockBookings from parent, not the fetched userBookings
  handleViewClassDetails: (classId: number) => void;
}

export const CalendarSection = ({ 
  selectedDate, 
  setSelectedDate,
  bookings, // Renaming this prop to 'initialBookings' or clarifying its use might be good if it conflicts with 'userBookings' state
  handleViewClassDetails
}: CalendarSectionProps) => {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(selectedDate));
  const classesForView = getClassesForDate(selectedDate);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isClassAlreadyBooked, setIsClassAlreadyBooked] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [bookedClasses, setBookedClasses] = useState<any[]>([]); // This state might not be strictly necessary if userBookings contains all info
  
  // Helper function to safely handle class data from bookings
  const isValidClassData = (classData: any): boolean => {
    return classData !== null && 
           typeof classData === 'object' && 
           'schedule' in classData && 
           'name' in classData && 
           'start_time' in classData && 
           'end_time' in classData;
  };

  // Fetch real user bookings from Supabase
  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!user) return;
      
      try {
        // Step 1: Fetch bookings, ensure class_id is selected (or the correct FK column name)
        // Assuming 'class_id' is the FK in 'bookings' table linking to 'classes.id'
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*, class_id') 
          .eq('user_id', user.id)
          .eq('status', 'confirmed');
          
        if (bookingsError) throw bookingsError;

        if (bookingsData && bookingsData.length > 0) {
          const bookingsWithClassesPromises = bookingsData.map(async (booking) => {
            if (!booking.class_id) { 
              console.warn(`Booking ID ${booking.id} has no class_id.`);
              return { ...booking, classes: null }; // Booking without a class
            }

            const { data: classData, error: classError } = await supabase
              .from('classes')
              .select('id, name, schedule, start_time, end_time') // Select specific fields needed
              .eq('id', booking.class_id)
              .single(); 
            
            if (classError) {
              console.error(`Error fetching class details for class_id ${booking.class_id}:`, classError.message);
              return { ...booking, classes: null }; // Attach null if class fetch fails
            }
            return { ...booking, classes: classData };
          });
          
          const bookingsWithClasses = await Promise.all(bookingsWithClassesPromises);
          setUserBookings(bookingsWithClasses);
          
          const validClasses = bookingsWithClasses
            .map(b => b.classes)
            .filter(isValidClassData); // Use the helper to ensure data is valid
          setBookedClasses(validClasses);

        } else {
          // No bookings found for the user or bookingsData is null
          setUserBookings([]);
          setBookedClasses([]);
        }

      } catch (error: any) {
        console.error('Error fetching bookings or class details:', error.message);
        toast({
          title: "Error",
          description: "Failed to load your bookings. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    fetchUserBookings();
  }, [user, toast]); // Removed 'bookedClasses' from deps as it's set inside
  
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
    // Check if class is already booked by looking at userBookings from Supabase
    const isBooked = userBookings.some(booking => booking.class_id === classId && booking.status === 'confirmed');
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
    // This would typically involve an API call to Supabase to update the booking status
    toast({
      title: "Booking cancelled",
      description: "Your booking has been cancelled successfully. (Placeholder - implement actual cancellation)",
      variant: "default"
    });
    setBookingDialogOpen(false);
    // TODO: Re-fetch bookings or update userBookings state after cancellation
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
              {currentMonthDays.map((day) => { // Removed index as dateKey is better key
                const dateKey = format(day, 'yyyy-MM-dd');
                const hasClasses = daysWithClasses[dateKey];
                // const classCount = hasClasses ? hasClasses.length : 0; // classCount not used
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
              {userBookings.length > 0 ? 'My Bookings' : 'Classes on ' + format(selectedDate, "MMMM d, yyyy")}
            </h3>
            
            <div className="space-y-3">
              {userBookings.length > 0 ? (
                userBookings.map(booking => {
                  const classData = booking.classes;
                  
                  if (!isValidClassData(classData)) {
                     // Optionally, render something for bookings with missing class data or just skip
                    console.warn(`Booking ID ${booking.id} has invalid or missing class data.`, classData);
                    return null; // Skip rendering this booking
                  }
                  
                  const classDate = classData.schedule ? parseISO(classData.schedule) : new Date(); // Ensure valid date parsing
                  
                  return (
                    <div 
                      key={booking.id} 
                      className="bg-gray-50 p-3 rounded-md border-l-4 border-purple-500 cursor-pointer hover:bg-gray-100 transition-colors"
                      // onClick={() => handleClassClick(classData.id)} // classData might not have id if it's from 'classes' table directly
                                                                       // If classData.id is needed, ensure it's selected.
                                                                       // For now, clicking booked items might not be intended to open dialog.
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{classData.name}</p>
                          <div className="flex flex-col xs:flex-row text-xs text-gray-500">
                            <span className="flex items-center mr-2">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {format(classDate, 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {classData.start_time} - {classData.end_time}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            Booked
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                }).filter(Boolean)
              ) : classesForView.length > 0 ? (
                classesForView.map(cls => {
                  // Check against userBookings (from Supabase) if this mock class is booked by the user
                  const isBookedByUser = userBookings.some(b => b.class_id === cls.id && isValidClassData(b.classes));
                  
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
                          {isBookedByUser && ( // Show 'Booked' if this class (from mock data) matches a user's booking
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
                  <p>No classes scheduled for this day</p>
                  <p className="text-xs mt-1">Select another date or check your bookings</p>
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
