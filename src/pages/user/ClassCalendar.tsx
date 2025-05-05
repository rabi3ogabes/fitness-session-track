import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, parseISO, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Bell, AlertCircle, Check, X, Clock, BookOpen, Info, Users } from "lucide-react";
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
import { supabase, requireAuth } from "@/integrations/supabase/client";
import { ClassModel } from "@/pages/admin/components/classes/ClassTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Class type colors mapping
const classTypeColors = {
  yoga: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-500",
    calendarDay: "bg-purple-50"
  },
  workout: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500", 
    calendarDay: "bg-blue-50"
  },
  combat: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    dot: "bg-red-500", 
    calendarDay: "bg-red-50"
  },
  dance: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    dot: "bg-green-500",
    calendarDay: "bg-green-50"
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

// System settings - in a real app, these would be fetched from the database
const systemSettings = {
  cancellationTimeLimit: 4, // hours before class starts
};

// Booking validation schema
const bookingSchema = z.object({
  classIds: z.array(z.number()).min(1, "Please select at least one class"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const ClassCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [classes, setClasses] = useState<ClassWithBooking[]>([]);
  const [bookedClasses, setBookedClasses] = useState<number[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: "",
    remainingSessions: 0,
    totalSessions: 0,
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Create form with validation
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      classIds: [],
      acceptTerms: false
    }
  });
  
  // Calculate if sessions are low (25% or less)
  const sessionsLow = userData.remainingSessions <= (userData.totalSessions * 0.25);
  
  // Reset form values when selection changes
  useEffect(() => {
    form.setValue('classIds', selectedClasses);
  }, [selectedClasses, form]);
  
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
          .select('*')
          .eq('status', 'Active')
          .order('schedule', { ascending: true });
        
        if (error) {
          console.error("Error fetching classes:", error);
          throw error;
        }
        
        // Transform and add type property based on class name or difficulty
        const classesWithType = data.map((cls: ClassModel) => {
          let type = 'default';
          const name = cls.name.toLowerCase();
          
          if (name.includes('yoga') || name.includes('pilates')) {
            type = 'yoga';
          } else if (name.includes('boxing') || name.includes('mma') || name.includes('martial')) {
            type = 'combat';
          } else if (name.includes('zumba') || name.includes('dance')) {
            type = 'dance';
          } else if (name.includes('workout') || name.includes('training') || name.includes('hiit') || 
                    name.includes('cardio') || name.includes('strength')) {
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
          .eq('user_id', user.id)
          .eq('status', 'confirmed');
        
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

  const handleBookMultipleClasses = async (values: BookingFormValues) => {
    if (userData.remainingSessions < selectedClasses.length) {
      toast({
        title: "Not enough sessions",
        description: `You need ${selectedClasses.length} sessions but have only ${userData.remainingSessions} remaining.`,
        variant: "destructive"
      });
      return;
    }

    // Open confirmation dialog
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
    
    setIsBookingInProgress(true);
    
    try {
      // Prepare bookings data
      const bookings = selectedClasses.map(classId => ({
        user_id: user.id,
        class_id: classId,
        status: 'confirmed',
        booking_date: new Date().toISOString()
      }));
      
      // Insert bookings into Supabase
      const { error } = await supabase
        .from('bookings')
        .insert(bookings);
      
      if (error) {
        console.error("Error booking classes:", error);
        throw error;
      }
      
      // Update enrolled count for each class
      await Promise.all(selectedClasses.map(async (classId) => {
        const classToUpdate = classes.find(c => c.id === classId);
        if (classToUpdate) {
          const { error } = await supabase
            .from('classes')
            .update({ enrolled: (classToUpdate.enrolled || 0) + 1 })
            .eq('id', classId);
          
          if (error) {
            console.error(`Error updating enrolled count for class ${classId}:`, error);
          }
        }
      }));
      
      // Update local state
      setBookedClasses([...bookedClasses, ...selectedClasses]);
      
      // Update classes to mark as booked
      setClasses(prevClasses => 
        prevClasses.map(cls => ({
          ...cls,
          isBooked: bookedClasses.includes(cls.id) || selectedClasses.includes(cls.id),
          enrolled: selectedClasses.includes(cls.id) ? (cls.enrolled || 0) + 1 : cls.enrolled
        }))
      );
      
      // Update user sessions
      if (user) {
        const newRemainingSession = userData.remainingSessions - selectedClasses.length;
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            sessions_remaining: newRemainingSession
          })
          .eq('id', user.id);
        
        if (profileError) {
          console.error("Error updating user sessions:", profileError);
          // We'll still consider the booking successful, but log the error
        } else {
          // Update local state for user data
          setUserData({
            ...userData,
            remainingSessions: newRemainingSession
          });
        }
      }
      
      toast({
        title: "Classes booked successfully!",
        description: `You've booked ${selectedClasses.length} classes. The trainers have been notified.`,
      });
      
      setSelectedClasses([]);
      setConfirmDialogOpen(false);
      form.reset();
    } catch (err) {
      console.error("Error in confirmBooking:", err);
      toast({
        title: "Failed to book classes",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsBookingInProgress(false);
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
      
      // Update class enrolled count
      const classToUpdate = classes.find(c => c.id === classId);
      if (classToUpdate && classToUpdate.enrolled && classToUpdate.enrolled > 0) {
        const { error: updateError } = await supabase
          .from('classes')
          .update({ enrolled: classToUpdate.enrolled - 1 })
          .eq('id', classId);
        
        if (updateError) {
          console.error(`Error updating enrolled count for class ${classId}:`, updateError);
        }
      }
      
      // Update local state
      setBookedClasses(bookedClasses.filter(id => id !== classId));
      
      // Update classes to remove booked status and decrease enrolled count
      setClasses(prevClasses => 
        prevClasses.map(cls => ({
          ...cls,
          isBooked: cls.id === classId ? false : cls.isBooked,
          enrolled: cls.id === classId && cls.enrolled ? cls.enrolled - 1 : cls.enrolled
        }))
      );
      
      // Update user sessions
      if (user) {
        const newRemainingSession = userData.remainingSessions + 1;
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            sessions_remaining: newRemainingSession
          })
          .eq('id', user.id);
        
        if (profileError) {
          console.error("Error updating user sessions:", profileError);
          // We'll still consider the cancellation successful, but log the error
        } else {
          // Update local state for user data
          setUserData({
            ...userData,
            remainingSessions: newRemainingSession
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
  ).filter(Boolean) as ClassWithBooking[];

  // Check if a class is in the past
  const isClassInPast = (classDate: Date, classTime?: string) => {
    if (!classTime) return false;
    
    const now = new Date();
    const [hours, minutes] = classTime.split(':').map(Number);
    
    const classDateTime = new Date(classDate);
    classDateTime.setHours(hours, minutes);
    
    return classDateTime < now;
  };

  // Calculate how many sessions will remain after booking
  const remainingAfterBooking = userData.remainingSessions - selectedClasses.length;

  return (
    <DashboardLayout title="Book a Class">
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
            {/* Sidebar with user info and calendar */}
            <div className="lg:col-span-3 bg-gradient-to-br from-gym-blue to-gym-dark-blue text-white p-6">
              <div className="mb-6 pb-6 border-b border-white/20">
                <h2 className="text-2xl font-bold flex items-center mb-2">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Class Bookings
                </h2>
                <p className="text-white/70">Find and book your next workout session</p>
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full bg-white/10" />
                  <Skeleton className="h-32 w-full bg-white/10" />
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Users className="mr-2 h-5 w-5" />
                      <span className="text-lg font-medium">Your Sessions</span>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span>Remaining:</span>
                        <span className={cn("font-bold text-xl", sessionsLow ? "text-red-300" : "text-white")}>
                          {userData.remainingSessions}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-white/70">
                        <span>Total Package:</span>
                        <span>{userData.totalSessions}</span>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-white/20">
                            <div
                              style={{ width: `${(userData.remainingSessions / userData.totalSessions) * 100}%` }}
                              className={cn(
                                "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center",
                                sessionsLow ? "bg-red-400" : "bg-teal-400"
                              )}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {sessionsLow && (
                      <div className="flex items-center mt-4 text-sm text-red-300">
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Your sessions are running low!</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center mb-3">
                      <CalendarDays className="mr-2 h-5 w-5" />
                      <span className="text-lg font-medium">Select Date</span>
                    </div>
                    <div className="rounded-lg overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 mb-4">
                      <Calendar 
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="pointer-events-auto !bg-transparent !text-white"
                        modifiers={{
                          hasClass: isDayWithClass
                        }}
                        modifiersClassNames={{
                          hasClass: "!bg-white/10 !text-white !font-bold"
                        }}
                        components={{
                          DayContent: DayContent,
                        }}
                      />
                    </div>
                    
                    {/* Class type legend */}
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <h3 className="text-sm font-medium mb-3 flex items-center">
                        <Info className="mr-2 h-4 w-4" />
                        Class Types
                      </h3>
                      <div className="space-y-1.5">
                        {Object.entries(classTypeColors).map(([type, colors]) => (
                          type !== 'default' && (
                            <div key={type} className="flex items-center text-sm">
                              <span className={`w-3 h-3 rounded-full ${colors.dot} mr-2`}></span>
                              <span className="capitalize text-white/80">{type}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="mt-auto pt-4 text-white/70 text-sm">
                <div className="flex items-center mb-2">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span>Cancellation Policy</span>
                </div>
                <p>You can cancel a class up to {systemSettings.cancellationTimeLimit} hours before it starts.</p>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="lg:col-span-9 p-6">
              {/* Selected date classes */}
              <div className="mb-6">
                <h2 className="text-xl font-bold flex items-center text-gray-800 mb-4">
                  <Clock className="mr-2 h-5 w-5 text-gym-blue" />
                  Classes for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected date'}
                </h2>
                
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classesForSelectedDate.length > 0 ? (
                      classesForSelectedDate.map((cls) => {
                        const isBooked = bookedClasses.includes(cls.id);
                        const isSelected = selectedClasses.includes(cls.id);
                        const typeKey = (cls.type || 'default') as keyof typeof classTypeColors;
                        const typeColor = classTypeColors[typeKey] || classTypeColors.default;
                        const classDate = new Date(cls.schedule);
                        const isPast = isClassInPast(classDate, cls.start_time);
                        
                        const isPastCancellationWindow = () => {
                          if (!cls.start_time) return false;
                          const classHour = parseInt(cls.start_time.split(':')[0]);
                          const now = new Date();
                          const classDate = new Date(selectedDate!);
                          classDate.setHours(classHour);
                          return (classDate.getTime() - now.getTime()) / (1000 * 60 * 60) < systemSettings.cancellationTimeLimit;
                        };
                        
                        // Skip past classes - only show future classes and classes for today
                        if (isPast) return null;
                        
                        return (
                          <Card key={cls.id} className={cn(
                            "transition-all hover:shadow-md overflow-hidden",
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
                              {cls.location && (
                                <p className="text-sm text-gray-600 mt-1">Location: {cls.location}</p>
                              )}
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
                      })
                    ) : (
                      <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <CalendarDays className="mx-auto h-12 w-12 opacity-30 mb-2 text-gray-400" />
                        <h4 className="text-lg font-medium text-gray-700">No classes scheduled</h4>
                        <p className="text-gray-500">There are no classes available on this date.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected classes section */}
              {selectedClasses.length > 0 && (
                <div className="mt-8">
                  <Card>
                    <CardHeader className="bg-gym-light">
                      <CardTitle className="text-lg flex items-center text-gym-blue">
                        <Check className="mr-2 h-5 w-5" />
                        Selected Classes
                      </CardTitle>
                      <CardDescription>
                        You have selected {selectedClasses.length} {selectedClasses.length === 1 ? "class" : "classes"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {selectedClassesData.map(cls => (
                          <div key={cls.id} className="flex justify-between items-center border-b pb-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-3 h-3 rounded-full",
                                classTypeColors[cls.type as keyof typeof classTypeColors]?.dot || classTypeColors.default.dot
                              )} />
                              <div>
                                <p className="font-medium">{cls.name}</p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(cls.schedule), 'MMM d')} • {cls.start_time} - {cls.end_time}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => toggleClassSelection(cls.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600">Sessions to use:</span>
                          <Badge variant="outline" className="bg-gym-light text-gym-blue">
                            {selectedClasses.length}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-600">Remaining after booking:</span>
                          <Badge variant={remainingAfterBooking < 0 ? "destructive" : "outline"} 
                                className={remainingAfterBooking < 0 ? "" : "bg-green-50 text-green-800"}>
                            {remainingAfterBooking}
                          </Badge>
                        </div>
                        
                        <Form {...form}>
                          <form className="space-y-4">
                            <FormField
                              control={form.control}
                              name="acceptTerms"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-gray-50">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>
                                      I agree to the booking terms and conditions
                                    </FormLabel>
                                    <FormMessage />
                                  </div>
                                </FormItem>
                              )}
                            />
                          </form>
                        </Form>
                        
                        <Button 
                          onClick={form.handleSubmit(handleBookMultipleClasses)}
                          className="w-full mt-4 bg-gym-blue hover:bg-gym-dark-blue"
                          disabled={selectedClasses.length === 0 || remainingAfterBooking < 0 || !form.getValues().acceptTerms}
                        >
                          {isBookingInProgress ? "Processing..." : "Book Selected Classes"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
              <div className="flex justify-between font-medium mt-1 pt-1 border-t">
                <span>Sessions after booking:</span>
                <span className={cn(
                  "font-bold", 
                  remainingAfterBooking <= 0 ? "text-red-500" : 
                  remainingAfterBooking <= 5 ? "text-amber-500" : 
                  "text-green-600"
                )}>
                  {remainingAfterBooking}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={cancelBookingConfirmation} className="w-full sm:w-auto">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={confirmBooking} 
              className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue"
              disabled={!form.getValues().acceptTerms || isBookingInProgress}
            >
              {isBookingInProgress ? (
                <>Processing...</>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Booking
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClassCalendar;
