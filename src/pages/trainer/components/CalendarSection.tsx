import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { format, isSameDay, addMonths, subMonths, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { mockClasses, getClassesForDate } from "../mockData";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Tables } from "@/integrations/supabase/types";

interface ClassInfo {
  id: number;
  name: string;
  schedule: string; // ISO date string
  start_time: string | null;
  end_time: string | null;
}

interface BookingWithClassDetails extends Tables<'bookings'> {
  classes: ClassInfo | null;
}

interface CalendarSectionProps {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  bookings: any[]; // Changed to any[] to match TrainerDashboard
  handleViewClassDetails: (classId: number) => void;
}

export const CalendarSection = ({ 
  selectedDate, 
  setSelectedDate,
  bookings: propBookings, // Renamed to avoid confusion with userBookings state
  handleViewClassDetails
}: CalendarSectionProps) => {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(selectedDate));
  const classesForView = getClassesForDate(selectedDate);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isClassAlreadyBooked, setIsClassAlreadyBooked] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [userBookings, setUserBookings] = useState<BookingWithClassDetails[]>([]);
  
  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!user) return;
      
      try {
        const { data: userBookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            classes (
              id,
              name,
              schedule,
              start_time,
              end_time
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'confirmed');
          
        if (bookingsError) {
          console.error('Error fetching bookings with class details:', bookingsError);
          throw bookingsError;
        }
        
        if (!userBookingsData || userBookingsData.length === 0) {
          setUserBookings([]);
          return;
        }

        const validBookings = userBookingsData
          .map(booking => {
            if (booking.classes && typeof booking.classes === 'object' && 'id' in booking.classes) {
              return { ...booking, classes: booking.classes as ClassInfo };
            }
            return { ...booking, classes: null };
          }) as BookingWithClassDetails[]; // Asserting the final structure
        
        setUserBookings(validBookings);

      } catch (error: any) {
        console.error('Error in booking/class fetching process:', error);
        toast({
          title: "Error",
          description: "Failed to load your bookings. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    fetchUserBookings();
  }, [user, toast]);
  
  const handlePreviousMonth = () => {
    // Fix the type error by not using a callback for setCalendarDate
    const newDate = subMonths(calendarDate, 1);
    setCalendarDate(newDate);
  };
  
  const handleNextMonth = () => {
    // Fix the type error by not using a callback for setCalendarDate
    const newDate = addMonths(calendarDate, 1);
    setCalendarDate(newDate);
  };
  
  const daysWithClasses = mockClasses.reduce((acc, cls) => {
    const classDate = typeof cls.date === 'string' ? parseISO(cls.date) : cls.date;
    const dateKey = format(classDate, 'yyyy-MM-dd');
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    
    acc[dateKey].push(cls);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Function to safely check if a booking has valid class data
  const hasValidClassData = (booking: BookingWithClassDetails): booking is BookingWithClassDetails & { classes: ClassInfo } => {
    return booking.classes !== null && 
           typeof booking.classes === 'object' && 
           'id' in booking.classes &&
           typeof booking.classes.id === 'number' && 
           'schedule' in booking.classes &&
           typeof booking.classes.schedule === 'string';
  };

  // Pre-calculate bookings for the selected date to ensure type safety and avoid redundant filtering
  const bookingsForSelectedDate = userBookings.filter(booking => {
    if (!hasValidClassData(booking)) {
      return false; // booking.classes is null or not a valid ClassInfo object
    }
    // At this point, TypeScript knows booking.classes is ClassInfo (non-null and has required properties)
    try {
      const classDate = parseISO(booking.classes.schedule); // Now safe to access
      return isSameDay(classDate, selectedDate);
    } catch (error) {
      console.error("Invalid date format encountered for booking schedule:", booking.classes.schedule, error);
      return false; // If date parsing fails, treat as not matching
    }
  });
  
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    const startDate = monthStart;
    const endDate = monthEnd;
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const startDay = getDay(monthStart); // 0 (Sun) - 6 (Sat)
    
    const prevMonthDays = Array(startDay).fill(null);
    const daysAfter = (7 - ((days.length + startDay) % 7)) % 7;
    const nextMonthDays = Array(daysAfter).fill(null);
    
    return { prevMonthDays, currentMonthDays: days, nextMonthDays };
  };
  
  const { prevMonthDays, currentMonthDays, nextMonthDays } = generateCalendarDays();

  const handleClassClick = (classId: number) => {
    // Logic for propBookings (mock data from parent)
    // This needs class_id. `mockBookings` has `class` (string name).
    const isBookedUsingPropBookings = propBookings.some(b => (b as any).class_id === classId && b.status === 'confirmed');
    
    // Check against user's actual bookings from Supabase for the selected class ID
    const isBookedForThisClass = userBookings.some(userBooking => 
      hasValidClassData(userBooking) && userBooking.class_id === classId
    );

    setSelectedClassId(classId);
    // Favor checking against actual user bookings if available
    setIsClassAlreadyBooked(isBookedForThisClass || isBookedUsingPropBookings);
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
    if (selectedClassId !== null) {
      handleViewClassDetails(selectedClassId);
    }
    setBookingDialogOpen(false);
  };

  const handleCancelBooking = async () => {
    // For demo, just shows a toast. Real implementation would update Supabase.
    // Need to identify which booking to cancel. SelectedClassId might not be enough if user has multiple bookings for same class type on different dates.
    // This would require more specific booking ID.
    // For now, it's a generic cancel.
    toast({
      title: "Booking cancelled",
      description: "Your booking has been cancelled successfully.", // This is optimistic.
      variant: "default"
    });
    setBookingDialogOpen(false);
    // Potentially refetch bookings or update local state
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
                className="text-gray-500 hover:bg-gray-100"
              >
                &lt;
              </Button>
              <h3 className="font-medium text-center text-gray-700">
                {format(calendarDate, "MMMM yyyy")}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="text-gray-500 hover:bg-gray-100"
              >
                &gt;
              </Button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, i) => (
                <div key={i} className="text-xs font-medium text-gray-500 h-8 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {prevMonthDays.map((_, index) => (
                <div 
                  key={`prev-${index}`} 
                  className="h-10 p-0.5 text-center text-gray-300"
                >
                  <div className="w-full h-full rounded-md flex items-center justify-center">
                    {/* Empty cell */}
                  </div>
                </div>
              ))}
              
              {currentMonthDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                
                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "h-10 p-0.5 cursor-pointer transition-colors duration-150 ease-in-out",
                      isSelected ? "bg-purple-50 rounded-md" : "hover:bg-gray-100 rounded-md",
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="flex items-center justify-center h-full">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-sm",
                        isSelected ? "bg-purple-500 text-white font-semibold" : "text-gray-700",
                        isToday && !isSelected ? "border border-purple-500 text-purple-600 font-medium" : "",
                        isToday && isSelected ? "font-semibold" : ""
                      )}>
                        {format(day, "d")}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {nextMonthDays.map((_, index) => (
                <div 
                  key={`next-${index}`} 
                  className="h-10 p-0.5 text-center text-gray-300"
                >
                  <div className="w-full h-full rounded-md flex items-center justify-center">
                    {/* Empty cell */}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-3 flex items-center text-gray-700">
              <Clock className="h-4 w-4 mr-2 text-purple-500" />
              {bookingsForSelectedDate.length > 0 
                ? `My Bookings for ${format(selectedDate, "MMMM d")}` 
                : `Available Classes on ${format(selectedDate, "MMMM d")}`
              }
            </h3>
            
            <div className="space-y-3">
              {/* Display user's bookings for the selected date (using pre-filtered bookingsForSelectedDate) */}
              {bookingsForSelectedDate.length > 0 && bookingsForSelectedDate.map(booking => {
                  // booking.classes is guaranteed to be ClassInfo here due to our filtering
                  // with hasValidClassData, so it's safe to use with non-null assertion
                  const classData = booking.classes!;
                  const classDate = parseISO(classData.schedule);
                  
                  return (
                    <div 
                      key={booking.id} 
                      className="bg-gray-50 p-3 rounded-md border-l-4 border-purple-500 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{classData.name}</p>
                          <div className="flex flex-col sm:flex-row text-xs text-gray-500 mt-1">
                            <span className="flex items-center mr-3">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {format(classDate, 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {classData.start_time || 'N/A'} - {classData.end_time || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200"> 
                          Booked
                        </Badge>
                      </div>
                    </div>
                  );
                })}

              {/* Display available classes if no bookings for the date */}
              {classesForView.length > 0 && bookingsForSelectedDate.length === 0 && (
                classesForView.map(cls => {
                  const isGloballyBooked = userBookings.some(userBooking => 
                    hasValidClassData(userBooking) && userBooking.class_id === cls.id
                  );
                  
                  return (
                    <div 
                      key={cls.id} 
                      className="bg-white p-3 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                      onClick={() => handleClassClick(cls.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{cls.name}</p>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {cls.time}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isGloballyBooked && (
                            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                              Booked
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {cls.enrolled}/{cls.capacity}
                          </Badge>
                          <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); handleClassClick(cls.id); }}>
                            Book
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* No classes available and no user bookings for the selected date */}
              {classesForView.length === 0 && bookingsForSelectedDate.length === 0 && (
                <div className="text-gray-500 text-center py-6 bg-gray-50 rounded-md border border-dashed border-gray-300">
                  <p>No classes scheduled for this date.</p>
                  <p className="text-xs mt-1">Please select another date.</p>
                </div>
              )}
            </div>
          </div>

          <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isClassAlreadyBooked ? "Class Already Booked" : "Book Class"}
                </DialogTitle>
                <DialogDescription>
                  {isClassAlreadyBooked 
                    ? "You have already booked this class. You can manage your bookings from your profile." 
                    : "Confirm your class booking. Details will be shown on the next step."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <DialogFooter className="sm:justify-start mt-4">
                {isClassAlreadyBooked ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                      Close
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" variant="default" onClick={handleBookClass}>
                      Proceed to Book
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
