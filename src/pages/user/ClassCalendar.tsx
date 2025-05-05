
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Bell, AlertCircle, Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ClassModel } from "@/pages/admin/components/classes/ClassTypes";
import { Skeleton } from "@/components/ui/skeleton";

// Class type colors mapping
const classTypeColors = {
  yoga: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    dot: "bg-red-500",
    calendarDay: "bg-red-50"
  },
  workout: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    dot: "bg-green-500",
    calendarDay: "bg-green-50"
  },
  combat: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500", 
    calendarDay: "bg-blue-50"
  },
  dance: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-500",
    calendarDay: "bg-purple-50"
  },
  default: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
    dot: "bg-gray-500",
    calendarDay: "bg-gray-50"
  }
};

interface ClassWithBooking extends ClassModel {
  type?: string;
  isBooked?: boolean;
}

interface UserData {
  name: string;
  remainingSessions: number;
  totalSessions: number;
}

// Mock system settings - in a real app, these would be fetched from the database
const systemSettings = {
  cancellationTimeLimit: 4, // hours before class starts
};

const ClassCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [classes, setClasses] = useState<ClassWithBooking[]>([]);
  const [bookedClasses, setBookedClasses] = useState<number[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData>({
    name: "",
    remainingSessions: 0,
    totalSessions: 0,
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Calculate if sessions are low (25% or less)
  const sessionsLow = userData.remainingSessions <= (userData.totalSessions * 0.25);
  
  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, sessions_remaining, total_sessions')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user data:", error);
          throw error;
        }
        
        setUserData({
          name: data.name || "User",
          remainingSessions: data.sessions_remaining || 0,
          totalSessions: data.total_sessions || 0,
        });
      } catch (err) {
        console.error("Error in fetchUserData:", err);
        toast({
          title: "Failed to load user data",
          description: "Please refresh the page and try again",
          variant: "destructive",
        });
      }
    };
    
    fetchUserData();
  }, [user, toast]);
  
  // Fetch classes from Supabase
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*');
        
        if (error) {
          console.error("Error fetching classes:", error);
          throw error;
        }
        
        // Transform and add type property (in a real app, this would be a field in the database)
        const classesWithType = data.map((cls: ClassModel) => {
          // Assign a type based on name or difficulty for demo purposes
          // In a real app, this would be a proper field in the database
          let type = 'default';
          const name = cls.name.toLowerCase();
          
          if (name.includes('yoga') || name.includes('pilates')) {
            type = 'yoga';
          } else if (name.includes('boxing') || name.includes('mma')) {
            type = 'combat';
          } else if (name.includes('zumba') || name.includes('dance')) {
            type = 'dance';
          } else if (name.includes('workout') || name.includes('training') || name.includes('hiit')) {
            type = 'workout';
          }
          
          return { ...cls, type };
        });
        
        setClasses(classesWithType);
      } catch (err) {
        console.error("Error in fetchClasses:", err);
        toast({
          title: "Failed to load classes",
          description: "Please refresh the page and try again",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClasses();
  }, [toast]);
  
  // Fetch user bookings from Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('class_id')
          .eq('user_id', user.id);
        
        if (error) {
          console.error("Error fetching bookings:", error);
          throw error;
        }
        
        const bookedClassIds = data.map(booking => booking.class_id);
        setBookedClasses(bookedClassIds);
        
        // Mark booked classes in the classes array
        setClasses(prevClasses => 
          prevClasses.map(cls => ({
            ...cls,
            isBooked: bookedClassIds.includes(cls.id)
          }))
        );
      } catch (err) {
        console.error("Error in fetchBookings:", err);
      }
    };
    
    fetchBookings();
  }, [user]);
  
  // Get classes for the selected date
  const classesForSelectedDate = selectedDate 
    ? classes.filter(cls => {
        const classDate = new Date(cls.schedule);
        return isSameDay(classDate, selectedDate);
      })
    : [];
  
  // Function to highlight dates with classes and show class types
  const isDayWithClass = (date: Date) => {
    return classes.some(cls => {
      const classDate = new Date(cls.schedule);
      return isSameDay(classDate, date);
    });
  };

  // Get class types for a specific date
  const getClassTypesForDate = (date: Date) => {
    return classes
      .filter(cls => {
        const classDate = new Date(cls.schedule);
        return isSameDay(classDate, date);
      })
      .map(cls => cls.type)
      .filter((value, index, self) => self.indexOf(value) === index); // Get unique types
  };

  // Render color dots for class types on a specific date
  const renderClassTypeDots = (date: Date) => {
    const classTypes = getClassTypesForDate(date);
    
    if (classTypes.length === 0) return null;
    
    return (
      <div className="flex justify-center mt-1 space-x-1">
        {classTypes.map((type, idx) => (
          <div 
            key={idx}
            className={`h-2 w-2 rounded-full ${classTypeColors[type as keyof typeof classTypeColors]?.dot || classTypeColors.default.dot}`}
          />
        ))}
      </div>
    );
  };

  const toggleClassSelection = (classId: number) => {
    setSelectedClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleBookMultipleClasses = () => {
    if (userData.remainingSessions < selectedClasses.length) {
      toast({
        title: "Not enough sessions",
        description: `You need ${selectedClasses.length} sessions but have only ${userData.remainingSessions} remaining.`,
        variant: "destructive"
      });
      return;
    }

    // Open confirmation dialog instead of directly booking
    setConfirmDialogOpen(true);
  };
  
  const confirmBooking = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to book classes",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Prepare bookings data
      const bookings = selectedClasses.map(classId => ({
        user_id: user.id,
        class_id: classId,
        status: 'confirmed'
      }));
      
      // Insert bookings into Supabase
      const { error } = await supabase
        .from('bookings')
        .insert(bookings);
      
      if (error) {
        console.error("Error booking classes:", error);
        throw error;
      }
      
      // Update local state
      setBookedClasses([...bookedClasses, ...selectedClasses]);
      
      // Update classes to mark as booked
      setClasses(prevClasses => 
        prevClasses.map(cls => ({
          ...cls,
          isBooked: bookedClasses.includes(cls.id) || selectedClasses.includes(cls.id)
        }))
      );
      
      // Update user sessions
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            sessions_remaining: userData.remainingSessions - selectedClasses.length 
          })
          .eq('id', user.id);
        
        if (profileError) {
          console.error("Error updating user sessions:", profileError);
          // We'll still consider the booking successful, but log the error
        } else {
          // Update local state for user data
          setUserData({
            ...userData,
            remainingSessions: userData.remainingSessions - selectedClasses.length
          });
        }
      }
      
      toast({
        title: "Classes booked successfully!",
        description: `You've booked ${selectedClasses.length} classes. The trainers have been notified.`,
      });
      
      setSelectedClasses([]);
      setConfirmDialogOpen(false);
    } catch (err) {
      console.error("Error in confirmBooking:", err);
      toast({
        title: "Failed to book classes",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  const cancelBookingConfirmation = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleCancelBooking = async (classId: number, classTime: string, className: string) => {
    if (!user) return;
    
    // Calculate if cancellation is within allowed time limit
    const classHour = parseInt(classTime.split(':')[0]);
    const now = new Date();
    const classDate = new Date(selectedDate!);
    classDate.setHours(classHour);
    
    const hoursDifference = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDifference < systemSettings.cancellationTimeLimit) {
      toast({
        title: "Cannot cancel class",
        description: `You can only cancel classes ${systemSettings.cancellationTimeLimit} hours or more before they start.`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Delete booking from Supabase
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('user_id', user.id)
        .eq('class_id', classId);
      
      if (error) {
        console.error("Error cancelling booking:", error);
        throw error;
      }
      
      // Update local state
      setBookedClasses(bookedClasses.filter(id => id !== classId));
      
      // Update classes to remove booked status
      setClasses(prevClasses => 
        prevClasses.map(cls => ({
          ...cls,
          isBooked: cls.id === classId ? false : cls.isBooked
        }))
      );
      
      // Update user sessions
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            sessions_remaining: userData.remainingSessions + 1
          })
          .eq('id', user.id);
        
        if (profileError) {
          console.error("Error updating user sessions:", profileError);
          // We'll still consider the cancellation successful, but log the error
        } else {
          // Update local state for user data
          setUserData({
            ...userData,
            remainingSessions: userData.remainingSessions + 1
          });
        }
      }
      
      toast({
        title: "Class cancelled",
        description: `You've successfully cancelled your ${className} class. The trainer has been notified.`,
      });
    } catch (err) {
      console.error("Error in handleCancelBooking:", err);
      toast({
        title: "Failed to cancel booking",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Custom day content renderer for the calendar
  const DayContent = (props: any) => {
    const { date, ...otherProps } = props;
    return (
      <div className="flex flex-col items-center">
        <div {...otherProps} />
        {renderClassTypeDots(date)}
      </div>
    );
  };

  const selectedClassesData = selectedClasses.map(id => 
    classes.find(cls => cls.id === id)
  ).filter(Boolean);

  return (
    <DashboardLayout title="Book a Class">
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Class Schedule</h2>
              <p className="text-gray-500">Select a date to view available classes</p>
            </div>
            <div className="mt-3 md:mt-0">
              {isLoading ? (
                <Skeleton className="h-10 w-48" />
              ) : (
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-5 w-5 text-gym-blue" />
                  <span>
                    Sessions remaining: <span className={cn("font-bold", sessionsLow ? "text-red-500" : "text-gym-blue")}>
                      {userData.remainingSessions}
                    </span>
                  </span>
                </div>
              )}
              {sessionsLow && (
                <div className="flex items-center mt-2 text-sm text-red-500">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Your sessions are running low. Consider renewing your membership.</span>
                </div>
              )}
              <div className="flex items-center mt-2 text-sm text-amber-600">
                <AlertCircle className="mr-2 h-4 w-4" />
                <span>You can cancel a class up to {systemSettings.cancellationTimeLimit} hours before it starts.</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="flex flex-col space-y-4">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <Calendar 
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="pointer-events-auto w-full"
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
                </div>
                
                {/* Class type legend */}
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-medium mb-2">Class Types</h3>
                  <div className="space-y-2">
                    {Object.entries(classTypeColors).map(([type, colors]) => (
                      type !== 'default' && (
                        <div key={type} className="flex items-center">
                          <span className={`w-3 h-3 rounded-full ${colors.dot} mr-2`}></span>
                          <span className="capitalize">{type}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              {selectedDate && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      Classes for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected date'}
                    </h3>
                    
                    {selectedClasses.length > 0 && (
                      <Button 
                        onClick={handleBookMultipleClasses}
                        className="bg-gym-blue hover:bg-gym-dark-blue"
                      >
                        Book Selected ({selectedClasses.length})
                      </Button>
                    )}
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : (
                    classesForSelectedDate.length > 0 ? (
                      <div className="space-y-4">
                        {classesForSelectedDate.map((cls) => {
                          const isBooked = bookedClasses.includes(cls.id);
                          const isSelected = selectedClasses.includes(cls.id);
                          const typeKey = (cls.type || 'default') as keyof typeof classTypeColors;
                          const typeColor = classTypeColors[typeKey] || classTypeColors.default;
                          
                          const isPastCancellationWindow = () => {
                            if (!cls.start_time) return false;
                            const classHour = parseInt(cls.start_time.split(':')[0]);
                            const now = new Date();
                            const classDate = new Date(selectedDate!);
                            classDate.setHours(classHour);
                            return (classDate.getTime() - now.getTime()) / (1000 * 60 * 60) < systemSettings.cancellationTimeLimit;
                          };
                          
                          return (
                            <Card key={cls.id} className={cn(
                              "transition-all hover:shadow",
                              isBooked ? "border-2 border-gym-blue" : "",
                              isSelected ? "border-2 border-green-500" : ""
                            )}>
                              <CardHeader className={`pb-2 ${typeColor.bg}`}>
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center space-x-2">
                                    {!isBooked && (
                                      <Checkbox 
                                        checked={isSelected}
                                        onCheckedChange={() => toggleClassSelection(cls.id)}
                                        disabled={cls.enrolled >= cls.capacity || isBooked || userData.remainingSessions <= 0}
                                        className="border-gym-blue"
                                        id={`class-${cls.id}`}
                                      />
                                    )}
                                    <div>
                                      <CardTitle className={typeColor.text}>{cls.name}</CardTitle>
                                      <CardDescription>
                                        {cls.start_time && cls.end_time ? `${cls.start_time} - ${cls.end_time}` : "Time not specified"}
                                      </CardDescription>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge 
                                      variant={cls.enrolled >= cls.capacity ? "destructive" : "outline"}
                                      className={cls.enrolled >= cls.capacity ? "" : `${typeColor.border} ${typeColor.text}`}
                                    >
                                      {cls.enrolled >= cls.capacity ? "Full" : `${cls.enrolled}/${cls.capacity}`}
                                    </Badge>
                                    {isBooked && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">Booked</Badge>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm">Trainer: {cls.trainer}</p>
                                  <Badge variant="outline" className={`${typeColor.bg} ${typeColor.text} ${typeColor.border} capitalize`}>
                                    {cls.type || "General"}
                                  </Badge>
                                </div>
                                {cls.description && (
                                  <p className="text-sm text-gray-600 mt-2">{cls.description}</p>
                                )}
                              </CardContent>
                              <CardFooter>
                                {isBooked ? (
                                  <Button 
                                    onClick={() => handleCancelBooking(
                                      cls.id, 
                                      cls.start_time || "00:00", 
                                      cls.name
                                    )}
                                    className="w-full bg-red-500 hover:bg-red-600"
                                    disabled={isPastCancellationWindow()}
                                  >
                                    {isPastCancellationWindow() ? 
                                      `Can't Cancel (< ${systemSettings.cancellationTimeLimit}h)` : 
                                      "Cancel Booking"}
                                  </Button>
                                ) : (
                                  <Button 
                                    onClick={() => toggleClassSelection(cls.id)}
                                    className={cn(
                                      "w-full",
                                      isSelected ? "bg-green-500 hover:bg-green-600" : "bg-gym-blue hover:bg-gym-dark-blue"
                                    )}
                                    disabled={cls.enrolled >= cls.capacity || userData.remainingSessions <= 0}
                                  >
                                    {isSelected ? "Selected" : 
                                      cls.enrolled >= cls.capacity ? "Class Full" : 
                                      userData.remainingSessions <= 0 ? "No Sessions Left" : 
                                      "Select Class"}
                                  </Button>
                                )}
                              </CardFooter>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarDays className="mx-auto h-12 w-12 opacity-30 mb-2" />
                        <h4 className="text-lg font-medium">No classes scheduled</h4>
                        <p>There are no classes available on this date.</p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking confirmation dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Class Booking</DialogTitle>
            <DialogDescription>
              You're about to book the following classes:
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {selectedClassesData.map((cls: any) => (
                <div key={cls.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(cls.schedule), 'MMM d')} • {cls.start_time} - {cls.end_time}
                    </p>
                  </div>
                  <Badge variant="outline" className={`${
                    classTypeColors[cls.type as keyof typeof classTypeColors]?.bg || classTypeColors.default.bg
                  } ${
                    classTypeColors[cls.type as keyof typeof classTypeColors]?.text || classTypeColors.default.text
                  } capitalize`}>
                    {cls.type || "General"}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between">
                <span>Total sessions required:</span>
                <span className="font-bold">{selectedClasses.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Your remaining sessions:</span>
                <span className={cn("font-bold", sessionsLow ? "text-red-500" : "text-gym-blue")}>
                  {userData.remainingSessions}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={cancelBookingConfirmation} className="w-full sm:w-auto">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={confirmBooking} className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue">
              <Check className="mr-2 h-4 w-4" />
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClassCalendar;
