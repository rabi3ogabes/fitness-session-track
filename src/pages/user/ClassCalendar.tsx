
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, parseISO, isAfter, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft,
  ChevronRight,
  Clock, 
  AlertCircle, 
  Check, 
  X, 
  Users, 
  RefreshCw, 
  WifiOff,
  CheckCircle,
  ArrowRight,
  CalendarCheck,
  CalendarDays
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Class type colors mapping with purple as the primary color
const classTypeColors = {
  yoga: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-800",
    calendarDay: "bg-purple-50"
  },
  workout: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-800",
    calendarDay: "bg-green-50"
  },
  combat: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-800",
    calendarDay: "bg-blue-50"
  },
  dance: {
    bg: "bg-pink-100",
    text: "text-pink-800",
    border: "border-pink-200",
    dot: "bg-pink-500",
    badge: "bg-pink-100 text-pink-800",
    calendarDay: "bg-pink-50"
  },
  default: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
    dot: "bg-gray-500",
    badge: "bg-gray-100 text-gray-800",
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
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
});

// Demo user data for testing
const DEMO_USER_DATA: UserData = {
  name: "Demo User",
  remainingSessions: 8,
  totalSessions: 20
};

// Demo classes for testing
const DEMO_CLASSES: ClassWithBooking[] = [
  {
    id: 1,
    name: "Yoga Basics",
    status: "Active",
    schedule: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    start_time: "09:00",
    end_time: "10:00",
    capacity: 20,
    enrolled: 8,
    trainer: "Jane Smith",
    location: "Studio 1",
    type: "yoga",
    isBooked: false
  },
  {
    id: 2,
    name: "HIIT Workout",
    status: "Active",
    schedule: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    start_time: "11:00",
    end_time: "12:00",
    capacity: 15,
    enrolled: 12,
    trainer: "John Doe",
    location: "Gym Floor",
    type: "workout",
    isBooked: false
  },
  {
    id: 3,
    name: "Boxing Fundamentals",
    status: "Active",
    schedule: new Date().toISOString(),
    start_time: "14:00",
    end_time: "15:30",
    capacity: 10,
    enrolled: 5,
    trainer: "Mike Tyson",
    location: "Boxing Ring",
    type: "combat",
    isBooked: true
  },
  {
    id: 4,
    name: "Zumba Dance",
    status: "Active",
    schedule: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    start_time: "16:00",
    end_time: "17:00",
    capacity: 25,
    enrolled: 15,
    trainer: "Maria Lopez",
    location: "Dance Studio",
    type: "dance",
    isBooked: false
  }
];

type BookingFormValues = z.infer<typeof bookingSchema>;

const ClassCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [weekViewDate, setWeekViewDate] = useState<Date>(new Date());
  const [classes, setClasses] = useState<ClassWithBooking[]>([]);
  const [bookedClasses, setBookedClasses] = useState<number[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassWithBooking | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: "",
    remainingSessions: 0,
    totalSessions: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [isNetworkConnected, setIsNetworkConnected] = useState(true);
  const [activeTab, setActiveTab] = useState("weekView");
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Create form with validation
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      acceptTerms: false
    }
  });

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkConnected(true);
      // Auto-retry fetching data when back online
      if (error) {
        handleRetry();
      }
    };
    
    const handleOffline = () => {
      setIsNetworkConnected(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial network status
    setIsNetworkConnected(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);
  
  // Calculate if sessions are low (25% or less)
  const sessionsLow = userData.remainingSessions <= (userData.totalSessions * 0.25);
  
  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        // Check if this is demo user
        if (user.id === "demo-user-id") {
          // For demo mode, use hardcoded data
          setUserData(DEMO_USER_DATA);
          return;
        }
        
        if (!isNetworkConnected) {
          setError("You are currently offline. Reconnect to load your profile data.");
          return;
        }
        
        // Clear any previous errors
        setError(null);
        
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
        setError("Failed to load user data. Please refresh the page and try again");
      }
    };
    
    fetchUserData();
  }, [user, isNetworkConnected]);
  
  // Fetch classes from Supabase
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      
      try {
        if (!isNetworkConnected) {
          // If offline, use demo data or cached data
          setClasses(DEMO_CLASSES);
          setIsLoading(false);
          return;
        }

        // Clear any previous errors
        setError(null);
        
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
        const classesWithType = data.length > 0 ? data.map((cls: ClassModel) => {
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
        }) : DEMO_CLASSES; // Use demo classes if no data returned
        
        setClasses(classesWithType);
      } catch (err) {
        console.error("Error in fetchClasses:", err);
        // Load demo classes as a fallback
        setClasses(DEMO_CLASSES);
        setError("Failed to load classes from the server. Using demo data instead.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClasses();
  }, [isNetworkConnected]);
  
  // Fetch user bookings from Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      try {
        if (user.id === "demo-user-id") {
          // For demo mode, use hardcoded bookings
          setBookedClasses([3]); // Mark class ID 3 as booked in demo mode
          
          // Update classes to mark as booked
          setClasses(prevClasses => 
            prevClasses.map(cls => ({
              ...cls,
              isBooked: cls.id === 3
            }))
          );
          return;
        }
        
        if (!isNetworkConnected) {
          return; // Don't attempt to fetch if offline
        }
        
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
        // Don't set an error here to avoid having multiple error messages
      }
    };
    
    fetchBookings();
  }, [user, isNetworkConnected]);
  
  // Function to highlight dates with classes
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

  const handleSelectClass = (cls: ClassWithBooking) => {
    setSelectedClass(cls);
    setConfirmDialogOpen(true);
  };

  const handleBooking = async () => {
    if (!selectedClass) return;
    
    if (userData.remainingSessions < 1) {
      toast({
        title: "Not enough sessions",
        description: "You need at least 1 session to book a class.",
        variant: "destructive"
      });
      setConfirmDialogOpen(false);
      return;
    }

    // Open confirmation dialog
    setConfirmDialogOpen(true);
  };
  
  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      setError(null);
      // This will trigger the useEffects to re-fetch data
      setIsNetworkConnected(navigator.onLine);
    }, 1000);
  };
  
  const confirmBooking = async () => {
    if (!user || !selectedClass) {
      toast({
        title: "Error",
        description: "Unable to process booking. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    setIsBookingInProgress(true);
    
    try {
      // Special handling for demo user
      if (user.id === "demo-user-id") {
        // Simulate successful booking for demo user
        setBookedClasses([...bookedClasses, selectedClass.id]);
        
        // Update classes to mark as booked
        setClasses(prevClasses => 
          prevClasses.map(cls => ({
            ...cls,
            isBooked: bookedClasses.includes(cls.id) || cls.id === selectedClass.id,
            enrolled: cls.id === selectedClass.id ? (cls.enrolled || 0) + 1 : cls.enrolled
          }))
        );
        
        // Update user sessions for demo
        const newRemainingSession = userData.remainingSessions - 1;
        setUserData({
          ...userData,
          remainingSessions: newRemainingSession
        });
        
        toast({
          title: "Class booked successfully! (Demo)",
          description: `You've booked ${selectedClass.name} in demo mode.`,
        });
        
        setSelectedClass(null);
        setConfirmDialogOpen(false);
        form.reset();
        setIsBookingInProgress(false);
        return;
      }
      
      if (!isNetworkConnected) {
        toast({
          title: "You're offline",
          description: "Bookings cannot be processed while offline. Please reconnect.",
          variant: "destructive"
        });
        setIsBookingInProgress(false);
        return;
      }
      
      // Insert booking into Supabase
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          class_id: selectedClass.id,
          status: 'confirmed',
          booking_date: new Date().toISOString()
        });
      
      if (error) {
        console.error("Error booking class:", error);
        throw error;
      }
      
      // Update enrolled count for the class
      const { error: updateError } = await supabase
        .from('classes')
        .update({ enrolled: (selectedClass.enrolled || 0) + 1 })
        .eq('id', selectedClass.id);
      
      if (updateError) {
        console.error(`Error updating enrolled count for class ${selectedClass.id}:`, updateError);
      }
      
      // Update local state
      setBookedClasses([...bookedClasses, selectedClass.id]);
      
      // Update classes to mark as booked
      setClasses(prevClasses => 
        prevClasses.map(cls => ({
          ...cls,
          isBooked: bookedClasses.includes(cls.id) || cls.id === selectedClass.id,
          enrolled: cls.id === selectedClass.id ? (cls.enrolled || 0) + 1 : cls.enrolled
        }))
      );
      
      // Update user sessions
      if (user) {
        const newRemainingSession = userData.remainingSessions - 1;
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            sessions_remaining: newRemainingSession
          })
          .eq('id', user.id);
        
        if (profileError) {
          console.error("Error updating user sessions:", profileError);
        } else {
          // Update local state for user data
          setUserData({
            ...userData,
            remainingSessions: newRemainingSession
          });
        }
      }
      
      toast({
        title: "Class booked successfully!",
        description: `You've booked ${selectedClass.name}. The trainer has been notified.`,
      });
      
      setSelectedClass(null);
      setConfirmDialogOpen(false);
      form.reset();
    } catch (err) {
      console.error("Error in confirmBooking:", err);
      toast({
        title: "Failed to book class",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsBookingInProgress(false);
    }
  };
  
  const cancelBookingConfirmation = () => {
    setConfirmDialogOpen(false);
    setSelectedClass(null);
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
      // Demo user handling
      if (user.id === "demo-user-id") {
        // Simulate successful cancellation for demo user
        setBookedClasses(bookedClasses.filter(id => id !== classId));
        
        // Update classes to remove booked status and decrease enrolled count
        setClasses(prevClasses => 
          prevClasses.map(cls => ({
            ...cls,
            isBooked: cls.id === classId ? false : cls.isBooked,
            enrolled: cls.id === classId && cls.enrolled ? cls.enrolled - 1 : cls.enrolled
          }))
        );
        
        // Update user sessions for demo
        const newRemainingSession = userData.remainingSessions + 1;
        setUserData({
          ...userData,
          remainingSessions: newRemainingSession
        });
        
        toast({
          title: "Class cancelled (Demo)",
          description: `You've successfully cancelled your ${className} class in demo mode.`,
        });
        return;
      }
      
      if (!isNetworkConnected) {
        toast({
          title: "You're offline",
          description: "Cancellations cannot be processed while offline. Please reconnect.",
          variant: "destructive"
        });
        return;
      }
      
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

  // Check if a class is in the past
  const isClassInPast = (classDate: Date, classTime?: string) => {
    if (!classTime) return false;
    
    const now = new Date();
    const [hours, minutes] = classTime.split(':').map(Number);
    
    const classDateTime = new Date(classDate);
    classDateTime.setHours(hours, minutes);
    
    return classDateTime < now;
  };
  
  // Get upcoming and booked classes
  const getClassesByDate = () => {
    const now = new Date();
    const upcomingClasses = classes.filter(cls => {
      const classDate = new Date(cls.schedule);
      return isAfter(classDate, now) || isSameDay(classDate, now);
    });
    
    // Sort by date and time
    return upcomingClasses.sort((a, b) => {
      const dateA = new Date(a.schedule);
      const dateB = new Date(b.schedule);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      // If same date, sort by time
      return a.start_time && b.start_time ? 
        a.start_time.localeCompare(b.start_time) : 0;
    });
  };
  
  const allClasses = getClassesByDate();
  const myBookedClasses = allClasses.filter(cls => cls.isBooked);
  
  // Get classes for the selected date
  const classesForSelectedDate = selectedDate 
    ? classes.filter(cls => {
        const classDate = new Date(cls.schedule);
        return isSameDay(classDate, selectedDate);
      })
    : [];

  // Week view navigation
  const handlePreviousWeek = () => {
    setWeekViewDate(prevDate => addDays(prevDate, -7));
  };

  const handleNextWeek = () => {
    setWeekViewDate(prevDate => addDays(prevDate, 7));
  };

  // Get days for week view
  const getWeekDays = () => {
    const start = startOfWeek(weekViewDate);
    const end = endOfWeek(weekViewDate);
    return eachDayOfInterval({ start, end });
  };

  const weekDays = getWeekDays();
  
  // Get classes for specific day in week view
  const getClassesForDay = (day: Date) => {
    return classes.filter(cls => {
      const classDate = new Date(cls.schedule);
      return isSameDay(classDate, day);
    }).sort((a, b) => {
      // Sort by time
      return a.start_time && b.start_time ? 
        a.start_time.localeCompare(b.start_time) : 0;
    });
  };

  // Render class card for week view
  const renderWeekDayClass = (cls: ClassWithBooking) => {
    const isBooked = cls.isBooked;
    const typeKey = (cls.type || 'default') as keyof typeof classTypeColors;
    const typeColor = classTypeColors[typeKey] || classTypeColors.default;
    
    return (
      <div 
        key={cls.id}
        className={cn(
          "p-2 rounded-md mb-1.5 text-sm cursor-pointer transition-all hover:shadow-sm",
          isBooked ? `${typeColor.bg} border border-purple-300` : `${typeColor.bg}`,
        )}
        onClick={() => handleSelectClass(cls)}
      >
        <div className="flex justify-between items-center">
          <div className="font-medium truncate">{cls.name}</div>
          {isBooked && <Check className="h-3.5 w-3.5 text-purple-600" />}
        </div>
        <div className="text-xs text-gray-600">{cls.start_time}</div>
        <div className="text-xs flex justify-between mt-1">
          <span>{cls.location}</span>
          <span>{cls.enrolled}/{cls.capacity}</span>
        </div>
      </div>
    );
  };
  
  return (
    <DashboardLayout title="Book a Class">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Header Section */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Class Bookings</h1>
              <p className="text-gray-500">Browse and book your fitness classes</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-10 w-40" />
            ) : (
              <div className="flex items-center px-4 py-2 bg-purple-50 rounded-lg border border-purple-100">
                <Users className="h-5 w-5 text-purple-500 mr-2" />
                <div>
                  <p className="text-sm text-purple-800">
                    Sessions: <span className={cn("font-bold", sessionsLow ? "text-red-500" : "text-purple-600")}>
                      {userData.remainingSessions}
                    </span>
                    <span className="text-gray-500">/{userData.totalSessions}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Error Alert */}
          {error && (
            <Alert variant={!isNetworkConnected ? "default" : "destructive"} 
              className={cn("mb-4", !isNetworkConnected ? "bg-yellow-50 border-yellow-200" : "")}>
              {!isNetworkConnected ? (
                <WifiOff className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{!isNetworkConnected ? "You're offline" : "Error"}</AlertTitle>
              <AlertDescription className="flex justify-between items-center">
                <span>{error}</span>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-4"
                  disabled={retrying || (!isNetworkConnected && error.includes("offline"))}
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1", retrying && "animate-spin")} />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs Navigation */}
          <Tabs defaultValue="weekView" className="mb-6" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekView">Week View</TabsTrigger>
              <TabsTrigger value="calendar">Month View</TabsTrigger>
              <TabsTrigger value="myBookings">My Bookings</TabsTrigger>
            </TabsList>
            
            {/* Week View Tab */}
            <TabsContent value="weekView" className="mt-4">
              <div className="space-y-4">
                {/* Week navigation */}
                <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-md">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePreviousWeek}
                    className="text-gray-600"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <h3 className="font-medium text-purple-800">
                    Week of {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                  </h3>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextWeek}
                    className="text-gray-600"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {/* Week days grid */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, index) => {
                    const dayClasses = getClassesForDay(day);
                    const isCurrentDay = isToday(day);
                    const isSelected = selectedDate && isSameDay(selectedDate, day);
                    
                    return (
                      <div 
                        key={index} 
                        className={cn(
                          "border rounded-md min-h-[200px] p-2",
                          isCurrentDay ? "border-purple-300 bg-purple-50" : "border-gray-200",
                          isSelected ? "ring-2 ring-purple-400" : ""
                        )}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className={cn(
                          "text-center py-2 mb-2 rounded-md font-medium",
                          isCurrentDay ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"
                        )}>
                          <div className="text-xs uppercase">{format(day, 'EEE')}</div>
                          <div className="text-lg">{format(day, 'd')}</div>
                        </div>
                        
                        <div className="space-y-1 overflow-y-auto max-h-[140px] pb-1">
                          {dayClasses.length > 0 ? (
                            dayClasses.map(cls => renderWeekDayClass(cls))
                          ) : (
                            <div className="text-xs text-gray-500 text-center py-4">
                              No classes
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Selected day classes */}
                {selectedDate && (
                  <div className="mt-8">
                    <h3 className="font-medium text-lg mb-3 flex items-center text-purple-800">
                      <CalendarCheck className="mr-2 h-5 w-5" />
                      Classes on {format(selectedDate, 'MMMM d, yyyy')}
                    </h3>
                    
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                      </div>
                    ) : classesForSelectedDate.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {classesForSelectedDate.map((cls) => {
                          const isBooked = cls.isBooked;
                          const typeKey = (cls.type || 'default') as keyof typeof classTypeColors;
                          const typeColor = classTypeColors[typeKey] || classTypeColors.default;
                          
                          return (
                            <Card key={cls.id} className={cn(
                              "overflow-hidden hover:shadow-md transition-all",
                              isBooked ? "border-2 border-purple-400" : ""
                            )}>
                              <div className={`h-2 w-full ${typeColor.bg}`}></div>
                              <CardHeader className="pb-2">
                                <div className="flex justify-between">
                                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                                  <Badge className={typeColor.badge}>
                                    {cls.type || "General"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  {cls.start_time} - {cls.end_time}
                                </div>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <div className="space-y-2 text-sm">
                                  <div><span className="font-medium">Trainer:</span> {cls.trainer}</div>
                                  <div><span className="font-medium">Location:</span> {cls.location}</div>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-medium">Capacity:</span> {cls.enrolled}/{cls.capacity}
                                    </div>
                                    {isBooked && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        <Check className="h-3 w-3 mr-1" />
                                        Booked
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                              <CardFooter>
                                {isBooked ? (
                                  <Button 
                                    onClick={() => handleCancelBooking(
                                      cls.id, 
                                      cls.start_time || "00:00", 
                                      cls.name
                                    )}
                                    variant="outline"
                                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    Cancel Booking
                                  </Button>
                                ) : (
                                  <Button 
                                    onClick={() => handleSelectClass(cls)}
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    disabled={cls.enrolled >= cls.capacity || userData.remainingSessions <= 0}
                                  >
                                    {cls.enrolled >= cls.capacity ? "Class Full" : 
                                      userData.remainingSessions <= 0 ? "No Sessions Left" : 
                                      "Book Now"}
                                  </Button>
                                )}
                              </CardFooter>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-10 border border-dashed rounded-lg bg-gray-50">
                        <CalendarDays className="mx-auto h-12 w-12 text-gray-300" />
                        <h4 className="mt-2 text-gray-700 font-medium">No classes scheduled</h4>
                        <p className="text-gray-500 text-sm">There are no classes available on this date.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Month View Tab */}
            <TabsContent value="calendar" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-1 bg-white p-4 rounded-lg border">
                  <div className="flex items-center mb-4">
                    <CalendarIcon className="h-5 w-5 text-purple-500 mr-2" />
                    <h2 className="font-medium text-gray-700">Select Date</h2>
                  </div>
                  
                  <Calendar 
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md w-full"
                    modifiers={{
                      hasClass: isDayWithClass
                    }}
                    modifiersClassNames={{
                      hasClass: "bg-purple-50 text-purple-700 font-medium"
                    }}
                    components={{
                      DayContent: DayContent
                    }}
                  />
                  
                  {/* Class Types Legend */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Class Types</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(classTypeColors).map(([type, colors]) => (
                        type !== 'default' && (
                          <div key={type} className="flex items-center text-xs">
                            <span className={`w-3 h-3 rounded-full ${colors.dot} mr-2`}></span>
                            <span className="capitalize">{type}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Classes for selected date */}
                <div className="lg:col-span-2">
                  <div className="flex items-center mb-4">
                    <Clock className="h-5 w-5 text-purple-500 mr-2" />
                    <h2 className="font-medium text-gray-800">
                      Classes for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected date'}
                    </h2>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : classesForSelectedDate.length > 0 ? (
                    <div className="space-y-4">
                      {classesForSelectedDate.map((cls) => {
                        const isBooked = cls.isBooked;
                        const typeKey = (cls.type || 'default') as keyof typeof classTypeColors;
                        const typeColor = classTypeColors[typeKey] || classTypeColors.default;
                        const classDate = new Date(cls.schedule);
                        const isPast = isClassInPast(classDate, cls.start_time);
                        
                        // Skip past classes
                        if (isPast) return null;

                        return (
                          <Card key={cls.id} className={cn(
                            "transition-all hover:shadow-sm",
                            isBooked ? "border-2 border-purple-500" : ""
                          )}>
                            <div className="flex h-full">
                              {/* Left colored bar based on class type */}
                              <div className={`w-2 ${typeColor.bg}`}></div>
                              
                              <div className="flex-1 p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-medium text-gray-800 text-lg">{cls.name}</h3>
                                    <p className="text-sm text-gray-500 flex items-center">
                                      <Clock className="h-3.5 w-3.5 mr-1" />
                                      {cls.start_time} - {cls.end_time}
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge className={`${typeColor.badge}`}>
                                      {cls.type || "General"}
                                    </Badge>
                                    
                                    {isBooked && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Booked
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                  <div>
                                    <p className="text-gray-600">
                                      <span className="font-medium">Trainer:</span> {cls.trainer}
                                    </p>
                                    {cls.location && (
                                      <p className="text-gray-600">
                                        <span className="font-medium">Location:</span> {cls.location}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-gray-600">
                                      <span className="font-medium">Capacity:</span>
                                      <span className={cls.enrolled >= cls.capacity ? "text-red-600 font-medium" : ""}>
                                        {" "}{cls.enrolled}/{cls.capacity}
                                      </span>
                                    </p>
                                    {sessionsLow && !isBooked && (
                                      <p className="text-amber-600 text-xs">
                                        You have low sessions remaining
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex justify-end">
                                  {isBooked ? (
                                    <Button 
                                      onClick={() => handleCancelBooking(
                                        cls.id, 
                                        cls.start_time || "00:00", 
                                        cls.name
                                      )}
                                      variant="outline"
                                      className="border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel Booking
                                    </Button>
                                  ) : (
                                    <Button 
                                      onClick={() => handleSelectClass(cls)}
                                      className="bg-purple-600 hover:bg-purple-700"
                                      disabled={cls.enrolled >= cls.capacity || userData.remainingSessions <= 0}
                                    >
                                      {cls.enrolled >= cls.capacity ? "Class Full" : 
                                        userData.remainingSessions <= 0 ? "No Sessions Left" : 
                                        "Book This Class"}
                                      <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed rounded-lg bg-gray-50">
                      <CalendarDays className="mx-auto h-12 w-12 text-gray-300" />
                      <h4 className="mt-2 text-gray-700 font-medium">No classes scheduled</h4>
                      <p className="text-gray-500 text-sm">There are no classes available on this date.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* My Bookings Tab */}
            <TabsContent value="myBookings" className="mt-4">
              <div className="mb-6 bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-purple-500 mr-2" />
                  <div>
                    <h3 className="font-medium text-purple-800">Your Sessions</h3>
                    <div className="flex items-center mt-1">
                      <div className="bg-gray-200 h-2 w-44 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full", 
                            sessionsLow ? "bg-red-500" : "bg-purple-500"
                          )} 
                          style={{
                            width: `${Math.min(100, (userData.remainingSessions / userData.totalSessions) * 100)}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm ml-2 font-medium">
                        {userData.remainingSessions}/{userData.totalSessions}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs mt-2 text-purple-700">
                  <AlertCircle className="inline h-3.5 w-3.5 mr-1" />
                  You can cancel a class up to {systemSettings.cancellationTimeLimit} hours before it starts.
                </div>
              </div>
              
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <CalendarCheck className="h-5 w-5 mr-2 text-purple-600" />
                Your Booked Classes
              </h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : myBookedClasses.length > 0 ? (
                <div className="space-y-4">
                  {myBookedClasses.map((cls) => {
                    const typeKey = (cls.type || 'default') as keyof typeof classTypeColors;
                    const typeColor = classTypeColors[typeKey] || classTypeColors.default;
                    const classDate = new Date(cls.schedule);
                    
                    const isPastCancellationWindow = () => {
                      if (!cls.start_time) return false;
                      const classHour = parseInt(cls.start_time.split(':')[0]);
                      const now = new Date();
                      const classDate = new Date(cls.schedule);
                      classDate.setHours(classHour);
                      return (classDate.getTime() - now.getTime()) / (1000 * 60 * 60) < systemSettings.cancellationTimeLimit;
                    };
                    
                    return (
                      <Card key={cls.id} className="overflow-hidden">
                        <div className="flex">
                          {/* Date column */}
                          <div className={`w-20 flex-none ${typeColor.bg} flex flex-col items-center justify-center p-3`}>
                            <div className="text-sm font-bold text-gray-800">{format(classDate, 'EEE')}</div>
                            <div className="text-2xl font-bold text-gray-800">{format(classDate, 'd')}</div>
                            <div className="text-xs text-gray-600">{format(classDate, 'MMM')}</div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-lg">{cls.name}</h3>
                                <p className="text-sm text-gray-500 flex items-center">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  {cls.start_time} - {cls.end_time}
                                </p>
                              </div>
                              <Badge className={typeColor.badge}>
                                {cls.type || "General"}
                              </Badge>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mt-3">
                              <div className="text-sm space-y-1">
                                <p><span className="font-medium">Trainer:</span> {cls.trainer}</p>
                                <p><span className="font-medium">Location:</span> {cls.location}</p>
                              </div>
                              
                              <div className="flex md:justify-end items-center">
                                <Button 
                                  onClick={() => handleCancelBooking(
                                    cls.id, 
                                    cls.start_time || "00:00", 
                                    cls.name
                                  )}
                                  variant="outline"
                                  className={cn(
                                    "border-red-300 text-red-600 hover:bg-red-50",
                                    isPastCancellationWindow() && "opacity-50 cursor-not-allowed"
                                  )}
                                  disabled={isPastCancellationWindow()}
                                >
                                  {isPastCancellationWindow() ? 
                                    `Can't Cancel (< ${systemSettings.cancellationTimeLimit}h)` : 
                                    "Cancel Booking"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50">
                  <CalendarDays className="mx-auto h-16 w-16 text-gray-300" />
                  <h4 className="mt-4 text-gray-700 font-medium">No booked classes</h4>
                  <p className="text-gray-500 mt-1">You haven't booked any classes yet</p>
                  <Button 
                    className="mt-4 bg-purple-600 hover:bg-purple-700"
                    onClick={() => setActiveTab("weekView")}
                  >
                    Browse Available Classes
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Booking confirmation dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Book Class</DialogTitle>
            <DialogDescription className="text-center">
              {selectedClass ? `${selectedClass.name} on ${
                selectedClass.schedule ? format(new Date(selectedClass.schedule), 'EEEE, MMMM d') : ''
              }` : 'Select a class to book'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClass && (
            <div className="py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-lg text-gray-800">{selectedClass.name}</h3>
                  <Badge className={
                    classTypeColors[(selectedClass.type || 'default') as keyof typeof classTypeColors]?.badge
                  }>
                    {selectedClass.type || 'General'}
                  </Badge>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <CalendarIcon className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <p className="font-medium">Date & Time</p>
                      <p className="text-gray-600">{format(new Date(selectedClass.schedule), 'EEEE, MMMM d, yyyy')}</p>
                      <p className="text-gray-600">{selectedClass.start_time} - {selectedClass.end_time}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-medium">Trainer</p>
                      <p className="text-gray-600">{selectedClass.trainer}</p>
                    </div>
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600">{selectedClass.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <div>
                      <span className="font-medium">Availability:</span>
                      <span className={cn(
                        "ml-1",
                        selectedClass.enrolled >= selectedClass.capacity ? "text-red-600 font-medium" : ""
                      )}>
                        {selectedClass.enrolled}/{selectedClass.capacity} spots filled
                      </span>
                    </div>
                    <Badge variant={selectedClass.enrolled >= selectedClass.capacity ? "destructive" : "outline"}>
                      {selectedClass.enrolled >= selectedClass.capacity ? "Full" : `${selectedClass.capacity - selectedClass.enrolled} Available`}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 p-4 border rounded-md bg-purple-50 border-purple-100">
                <h4 className="font-medium mb-2 text-purple-800">Session Information</h4>
                <div className="flex justify-between text-sm">
                  <span>Sessions required:</span>
                  <span className="font-bold">1</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Your remaining sessions:</span>
                  <span className={cn("font-bold", sessionsLow ? "text-red-500" : "text-purple-600")}>
                    {userData.remainingSessions}
                  </span>
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t border-purple-200">
                  <span>Sessions after booking:</span>
                  <span className={cn(
                    "font-bold", 
                    userData.remainingSessions - 1 <= 0 ? "text-red-500" : 
                    userData.remainingSessions - 1 <= 5 ? "text-amber-500" : 
                    "text-green-600"
                  )}>
                    {userData.remainingSessions - 1}
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={cancelBookingConfirmation} className="w-full sm:w-auto">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={confirmBooking} 
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
              disabled={!form.getValues().acceptTerms || isBookingInProgress || !selectedClass}
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
