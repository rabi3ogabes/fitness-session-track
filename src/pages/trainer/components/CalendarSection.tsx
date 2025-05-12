
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { format, isSameDay, addMonths, subMonths, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CalendarSectionProps {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  bookings: any[];
  handleViewClassDetails: (classId: number) => void;
}

// Define interface for class data with explicit properties
interface ClassData {
  id: number;
  name: string;
  schedule: string;
  start_time: string | null;
  end_time: string | null;
  capacity: number;
  enrolled: number | null;
  trainer?: string | null; // Using trainer field instead of trainer_id
  description?: string | null;
  difficulty?: string | null;
  gender?: string | null;
  location?: string | null;
  status?: string | null;
  trainers?: string[] | null;
  created_at?: string | null;
}

// Define an interface for trainer data
interface TrainerData {
  id: number;
  name: string;
  email?: string;
  phone?: string | null;
  gender?: string | null;
  specialization?: string | null;
  status?: string | null;
  created_at?: string | null;
}

// Define a simple record type for classes by date to avoid recursion
interface ClassesByDate {
  [key: string]: ClassData[];
}

export const CalendarSection = ({ 
  selectedDate, 
  setSelectedDate,
  bookings,
  handleViewClassDetails
}: CalendarSectionProps) => {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(selectedDate));
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isClassAlreadyBooked, setIsClassAlreadyBooked] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [classesForSelected, setClassesForSelected] = useState<ClassData[]>([]);
  // Use the properly defined type instead of the recursive type
  const [classesInMonth, setClassesInMonth] = useState<ClassesByDate>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch classes for the current month
  useEffect(() => {
    const fetchClassesForMonth = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Get trainer ID
        const { data: trainerData, error: trainerError } = await supabase
          .from('trainers')
          .select('id')
          .eq('email', user.email)
          .single();
          
        if (trainerError) {
          console.error('Error fetching trainer data:', trainerError);
          return;
        }
        
        if (!trainerData) {
          console.warn('No trainer record found');
          return;
        }
        
        // Get start and end dates for the month
        const monthStart = startOfMonth(calendarDate);
        const monthEnd = endOfMonth(calendarDate);
        
        const startDateString = format(monthStart, 'yyyy-MM-dd');
        const endDateString = format(monthEnd, 'yyyy-MM-dd');
        
        console.log(`Fetching classes from ${startDateString} to ${endDateString}`);
        
        // Get all classes for this month for this trainer - using 'trainer' field instead of 'trainer_id'
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('trainer', trainerData.id.toString())
          .gte('schedule', startDateString)
          .lte('schedule', endDateString)
          .order('schedule')
          .order('start_time');
          
        if (classesError) {
          console.error('Error fetching classes for month:', classesError);
          return;
        }
        
        // Organize classes by date
        const classesByDate: ClassesByDate = {};
        
        if (classesData) {
          classesData.forEach(cls => {
            const dateKey = cls.schedule;
            
            if (!classesByDate[dateKey]) {
              classesByDate[dateKey] = [];
            }
            
            classesByDate[dateKey].push(cls as ClassData);
          });
        }
        
        setClassesInMonth(classesByDate);
        
        // Update classes for selected date
        const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
        setClassesForSelected(classesByDate[selectedDateKey] || []);
        
      } catch (error) {
        console.error('Error loading calendar data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClassesForMonth();
  }, [calendarDate, user]);
  
  // Update classes for selected date when the date changes
  useEffect(() => {
    const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
    setClassesForSelected(classesInMonth[selectedDateKey] || []);
  }, [selectedDate, classesInMonth]);
  
  // Fetch real user bookings from Supabase
  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!user) return;
      
      try {
        const { data: trainerData, error: trainerError } = await supabase
          .from('trainers')
          .select('id')
          .eq('email', user.email)
          .single();
          
        if (trainerError || !trainerData) return;
          
        // Get bookings for classes taught by this trainer - using 'trainer' field
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('id')
          .eq('trainer', trainerData.id.toString());
          
        if (classesError || !classesData || classesData.length === 0) return;
        
        const classIds = classesData.map(c => c.id);
        
        // Now get all bookings for these classes
        const { data, error } = await supabase
          .from('bookings')
          .select('*, user:user_id(*)')
          .in('class_id', classIds);
          
        if (error) {
          console.error('Error fetching bookings:', error);
          return;
        }
        
        if (data) {
          setUserBookings(data);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };
    
    fetchUserBookings();
  }, [user]);
  
  // Calendar navigation handlers
  const handlePreviousMonth = () => {
    setCalendarDate(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    setCalendarDate(prev => addMonths(prev, 1));
  };
  
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

  const handleViewDetails = () => {
    if (selectedClassId) {
      handleViewClassDetails(selectedClassId);
      setBookingDialogOpen(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedClassId || !user) return;
    
    try {
      // Implementation of cancel booking logic
      const result = await supabase
        .from('bookings')
        .delete()
        .eq('class_id', selectedClassId)
        .eq('user_id', user.id);
        
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully.",
        variant: "default"
      });
      
      // Refresh bookings after cancellation
      const updatedBookings = bookings.filter(booking => 
        booking.class_id !== selectedClassId
      );
      
      // In a real implementation, you would fetch the updated bookings
      
      setBookingDialogOpen(false);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive"
      });
    }
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
                const hasClasses = classesInMonth[dateKey] && classesInMonth[dateKey].length > 0;
                const classCount = hasClasses ? classesInMonth[dateKey].length : 0;
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                
                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "h-10 p-0.5 cursor-pointer",
                      isToday && "font-bold",
                      isSelected && "bg-purple-50 rounded-md",
                      hasClasses && "bg-purple-50/50"
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="flex items-center justify-center h-full relative">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        isSelected ? "bg-purple-500 text-white" : "",
                        isToday && !isSelected ? "border border-purple-500" : ""
                      )}>
                        {format(day, "d")}
                      </div>
                      {hasClasses && (
                        <div className="absolute bottom-0 w-full flex justify-center">
                          <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                        </div>
                      )}
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
            
            {isLoading ? (
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                <span className="ml-2 text-sm text-gray-500">Loading classes...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {classesForSelected.length > 0 ? (
                  classesForSelected.map(cls => {
                    return (
                      <div 
                        key={cls.id} 
                        className="bg-gray-50 p-3 rounded-md border-l-4 border-purple-500 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleClassClick(cls.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{cls.name}</p>
                            <div className="flex flex-col xs:flex-row text-xs text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {cls.start_time} - {cls.end_time}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
            )}
          </div>

          {/* Class Action Dialog */}
          <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Class Details</DialogTitle>
                <DialogDescription>
                  View or manage this class
                </DialogDescription>
              </DialogHeader>
              
              <DialogFooter className="sm:justify-start">
                <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="default" onClick={handleViewDetails}>
                  View Details
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};
