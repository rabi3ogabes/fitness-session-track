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
    name: "User",  // Default name
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
  const sessionsLow = userData.remainingSessions <= Math.max(1, (userData.totalSessions * 0.25));
  
  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        // Check if this is demo user or if we're falling back to demo mode
        if (user.id === "demo-user-id" || !isNetworkConnected) {
          // For demo mode, use hardcoded data
          setUserData(DEMO_USER_DATA);
          setError(null);
          return;
        }
        
        if (!isNetworkConnected) {
          setError("You are currently offline. Reconnect to load your profile data.");
          return;
        }
        
        // Clear any previous errors
        setError(null);
        
        try {
          // First try to get the user profile
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('name, sessions_remaining, total_sessions')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.error("Error fetching user profile:", profileError);
            // If the profile doesn't exist, create it with default values
            if (profileError.code === "PGRST116") {
              // Profile not found, use user metadata to create a profile
              // Fix: Access user_metadata safely through user.user_metadata if it exists
              const userName = user.email || "User";
              
              // Set default values for now
              setUserData({
                name: userName,
                remainingSessions: 10, // Default value
                totalSessions: 20,     // Default value
              });
              
              return;
            }
            throw profileError;
          }
          
          setUserData({
            name: data.name || "User",
            remainingSessions: data.sessions_remaining || 0,
            totalSessions: data.total_sessions || 0,
          });
        } catch (err) {
          // Fall back to demo data on error
          console.error("Failed to get user profile, using demo data:", err);
          setUserData(DEMO_USER_DATA);
          setError("Failed to load user profile data. Using demo data instead.");
        }
      } catch (err) {
        console.error("Error in fetchUserData:", err);
        // Fall back to demo data
        setUserData(DEMO_USER_DATA);
        setError("Failed to load user data. Using demo data instead.");
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
          // If offline, use demo data
          setClasses(DEMO_CLASSES);
          setIsLoading(false);
          setError("You're offline. Using demo class data.");
          return;
        }

        // Clear any previous errors
        setError(null);
        
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
          
          if (data && data.length > 0) {
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
              
              return { ...cls, type, isBooked: false };
            });
            
            setClasses(classesWithType);
          } else {
            // Fallback to demo data if no classes returned
            setClasses(DEMO_CLASSES);
            setError("No classes found in the database. Using demo data.");
          }
        } catch (err) {
          // Fallback to demo data on error
          console.error("Error fetching classes:", err);
          setClasses(DEMO_CLASSES);
          setError("Failed to load classes from the server. Using demo data instead.");
        }
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
          
          if (data && data.length > 0) {
            const bookedClassIds = data.map(booking => booking.class_id);
            setBookedClasses(bookedClassIds);
            
            // Mark booked classes in the classes array
            setClasses(prevClasses => 
              prevClasses.map(cls => ({
                ...cls,
                isBooked: bookedClassIds.includes(cls.id)
              }))
            );
          } else {
            // No bookings found
            setBookedClasses([]);
          }
        } catch (err) {
          console.error("Error fetching bookings:", err);
          // Fallback for demo purposes
          if (user.id === "demo-user-id" || !isNetworkConnected) {
            setBookedClasses([3]);
            setClasses(prevClasses => 
              prevClasses.map(cls => ({
                ...cls,
                isBooked: cls.id === 3
              }))
            );
          }
        }
      } catch (err) {
        console.error("Error in fetchBookings:", err);
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
    
    // Check if this class is already booked
    const isBooked = cls.isBooked || bookedClasses.includes(cls.id);
    
    // Set the state to control dialog display
    setIsClassAlreadyBooked(isBooked);
    setConfirmDialogOpen(true);
  };

  // Add this state to track if the selected class is already booked
  const [isClassAlreadyBooked, setIsClassAlreadyBooked] = useState(false);

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
    }, 500);
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
      
      // Check if user has already booked this specific class
      if (bookedClasses.includes(selectedClass.id)) {
        toast({
          title: "Already booked",
          description: "You have already booked this class.",
          variant: "destructive"
        });
        setIsBookingInProgress(false);
        setConfirmDialogOpen(false);
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
  
  // FIX: Updated the handleCancelBooking function to correctly calculate hours difference
  const handleCancelBooking = async (classId: number, classTime: string, className: string) => {
    if (!user) return;
    
    try {
      // Calculate if cancellation is within allowed time limit
      const classHour = parseInt(classTime.split(':')[0]);
      const classMinute = parseInt(classTime.split(':')[1] || '0');
      const now = new Date();
      
      // Find the class object to get the correct date
      const classToCancel = classes.find(cls => cls.id === classId);
      if (!classToCancel) {
        toast({
          title: "Error",
          description: "Could not find class details",
          variant: "destructive"
        });
        return;
      }
      
      // Create a date object for the class time
      const classDate = new Date(classToCancel.schedule);
      classDate.setHours(classHour, classMinute, 0, 0);
      
      // Calculate hours difference correctly
      const hoursDifference = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      console.log("Class date:", classDate);
      console.log("Current time:", now);
      console.log("Hours difference:", hoursDifference);
      
      if (hoursDifference < systemSettings.cancellationTimeLimit) {
        toast({
          title: "Cannot cancel class",
          description: `You can only cancel classes ${systemSettings.cancellationTimeLimit} hours or more before they start.`,
          variant: "destructive"
        });
        return;
      }
      
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

  // Also fix isPastCancellationWindow function in "My Bookings" tab
  const isPastCancellationWindow = (cls: ClassWithBooking) => {
    if (!cls.start_time) return false;
    
    const [hours, minutes] = cls.start_time.split(':').map(Number);
    const now = new Date();
    const classDate = new Date(cls.schedule);
    classDate.setHours(hours, minutes, 0, 0);
    
    const hoursDifference = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursDifference < systemSettings.cancellationTimeLimit;
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
        <div className="text-xs flex justify-between">
          <span>{cls.trainer}</span>
          <span>{cls.enrolled}/{cls.capacity}</span>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Class Calendar">
      <div className="space-y-6">
        {error && !retrying && isNetworkConnected && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <Button 
                onClick={handleRetry} 
                size="sm" 
                className="ml-2 mt-2"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${retrying ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {!isNetworkConnected && (
          <Alert variant="destructive" className="mb-4 bg-amber-50 border-amber-200">
            <WifiOff className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">You're offline</AlertTitle>
            <AlertDescription className="text-amber-700">
              You're currently viewing demo data. Connect to the internet to see your real classes.
            </AlertDescription>
          </Alert>
        )}
        
        {userData.remainingSessions <= 2 && (
          <Alert className="mb-4 bg-purple-50 border-purple-200">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-800">Low Sessions</AlertTitle>
            <AlertDescription className="text-purple-700">
              You have {userData.remainingSessions} {userData.remainingSessions === 1 ? 'session' : 'sessions'} remaining. Consider upgrading your membership.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="weekView" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekView" className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Week View</span>
            </TabsTrigger>
            <TabsTrigger value="monthView" className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Month View</span>
            </TabsTrigger>
            <TabsTrigger value="myBookings" className="flex items-center gap-1">
              <CalendarCheck className="h-4 w-4" />
              <span className="hidden sm:inline">My Bookings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekView" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Previous</span>
                  </Button>
                  <h3 className="text-lg font-semibold text-center">
                    {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleNextWeek}>
                    <span className="mr-1 hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day, i) => (
                    <div
                      key={day.toString()}
                      className={cn(
                        "text-center py-1 text-xs font-medium",
                        isToday(day) && "bg-purple-50 text-purple-800 rounded-md"
                      )}
                    >
                      <div className="mb-1">{format(day, 'EEE')}</div>
                      <div className="text-sm">{format(day, 'd')}</div>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {weekDays.map((day) => (
                    <div
                      key={day.toString()}
                      className={cn(
                        "min-h-28 p-1 text-sm border rounded-md",
                        isToday(day) && "border-purple-200 bg-purple-50"
                      )}
                    >
                      {isLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-6 w-full" />
                        </div>
                      ) : (
                        getClassesForDay(day).map((cls) => renderWeekDayClass(cls))
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="monthView" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Class Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="border rounded-md p-2"
                  components={{
                    DayContent: DayContent
                  }}
                  modifiers={{
                    withClass: isDayWithClass
                  }}
                  modifiersClassNames={{
                    withClass: "font-semibold text-purple-800 bg-purple-50"
                  }}
                />
                <div className="mt-4 space-y-4">
                  <h3 className="font-medium text-lg">
                    {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date to view classes'}
                  </h3>
                  {selectedDate && (
                    <div>
                      {classesForSelectedDate.length > 0 ? (
                        <div className="space-y-3">
                          {classesForSelectedDate
                            .sort((a, b) => a.start_time && b.start_time ? a.start_time.localeCompare(b.start_time) : 0)
                            .map((cls) => {
                              const isPast = isClassInPast(selectedDate, cls.start_time);
                              const typeKey = (cls.type || 'default') as keyof typeof classTypeColors;
                              const typeColor = classTypeColors[typeKey] || classTypeColors.default;
                              const pastCancellationWindow = isPastCancellationWindow(cls);
                              
                              return (
                                <Card key={cls.id} className={cn(
                                  "cursor-pointer transition-shadow duration-200 hover:shadow-md",
                                  cls.isBooked && "border-purple-200",
                                  isPast && "opacity-60"
                                )}
                                onClick={() => !isPast && handleSelectClass(cls)}>
                                  <CardContent className="p-4">
                                    <div className="grid grid-cols-6 gap-4 items-center">
                                      <div className="col-span-5">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-lg">{cls.name}</h4>
                                            {cls.isBooked && (
                                              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Booked
                                              </Badge>
                                            )}
                                          </div>
                                          <Badge className={typeColor.badge}>
                                            {cls.type}
                                          </Badge>
                                        </div>
                                        <div className="mt-1">
                                          <div className="flex items-center text-sm text-gray-600">
                                            <Clock className="h-3.5 w-3.5 mr-1" /> {cls.start_time} - {cls.end_time}
                                          </div>
                                          <div className="flex items-center text-sm text-gray-600 mt-1">
                                            <Users className="h-3.5 w-3.5 mr-1" /> {cls.enrolled}/{cls.capacity} enrolled
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex justify-end items-center gap-2">
                                        {cls.isBooked && !isPast && (
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className={pastCancellationWindow ? "text-red-300" : "text-red-600"}
                                            disabled={pastCancellationWindow}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCancelBooking(cls.id, cls.start_time || "", cls.name);
                                            }}
                                          >
                                            <X className="h-4 w-4 mr-1" />
                                            Cancel
                                          </Button>
                                        )}
                                        <Button size="sm" variant={cls.isBooked ? "outline" : "default"} disabled={isPast}>
                                          {cls.isBooked ? "View" : "Book"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                    {cls.isBooked && pastCancellationWindow && !isPast && (
                                      <div className="mt-2">
                                        <Alert variant="destructive" className="py-2 px-3">
                                          <AlertCircle className="h-4 w-4" />
                                          <AlertDescription className="text-xs">
                                            Cannot cancel: Less than {systemSettings.cancellationTimeLimit} hours before start
                                          </AlertDescription>
                                        </Alert>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CalendarIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
                          <p>No classes scheduled for this date</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="myBookings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>My Booked Classes</span>
                  <Badge variant="outline" className="ml-2">
                    {myBookedClasses.length} bookings
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <div>
                    {myBookedClasses.length > 0 ? (
                      <div className="space-y-4">
                        {myBookedClasses.map(cls => {
                          const classDate = new Date(cls.schedule);
                          const pastCancellationWindow = isPastCancellationWindow(cls);
                          const isPast = isClassInPast(classDate, cls.start_time);
                          const typeKey = (cls.type || 'default') as keyof typeof classTypeColors;
                          const typeColor = classTypeColors[typeKey] || classTypeColors.default;
                          
                          return (
                            <Card key={cls.id} className={cn(
                              "border",
                              isPast ? "opacity-60 border-gray-200" : "border-purple-200",
                              typeColor.border
                            )}>
                              <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold">{cls.name}</h4>
                                      <Badge className={typeColor.badge}>
                                        {cls.type}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {format(classDate, 'EEE, MMM d')} • {cls.start_time} - {cls.end_time}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {cls.trainer} • {cls.location}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2 md:mt-0 mt-3">
                                    {!isPast && (
                                      <Button 
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancelBooking(cls.id, cls.start_time || "", cls.name);
                                        }}
                                        disabled={pastCancellationWindow}
                                        className={pastCancellationWindow ? "text-red-300" : "text-red-600"}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Cancel
                                      </Button>
                                    )}
                                    <Button 
                                      size="sm"
                                      onClick={() => handleSelectClass(cls)}
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                                {pastCancellationWindow && !isPast && (
                                  <div className="mt-2">
                                    <Alert variant="destructive" className="py-2 px-3">
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertDescription className="text-xs">
                                        Cannot cancel: Less than {systemSettings.cancellationTimeLimit} hours before start
                                      </AlertDescription>
                                    </Alert>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarCheck className="mx-auto h-12 w-12 opacity-20 mb-2" />
                        <p className="mb-2">You don't have any booked classes</p>
                        <Button 
                          onClick={() => setActiveTab("weekView")}
                          variant="outline"
                        >
                          Browse Classes
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isClassAlreadyBooked ? 'Class Details' : 'Confirm Booking'}
              </DialogTitle>
              {!isClassAlreadyBooked && (
                <DialogDescription>
                  You are booking the following class:
                </DialogDescription>
              )}
            </DialogHeader>
            
            {selectedClass && (
              <div className="space-y-4">
                <div className="grid gap-1">
                  <h3 className="font-semibold text-lg">{selectedClass.name}</h3>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedClass.schedule), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedClass.start_time} - {selectedClass.end_time}
                  </p>
                  <p className="text-sm text-gray-600">
                    Trainer: {selectedClass.trainer}
                  </p>
                  <p className="text-sm text-gray-600">
                    Location: {selectedClass.location}
                  </p>
                  <div className="flex items-center mt-1">
                    <Users className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600">
                      {selectedClass.enrolled} / {selectedClass.capacity} enrolled
                    </span>
                  </div>
                </div>
                
                {!isClassAlreadyBooked && (
                  <>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium">Your remaining sessions: {userData.remainingSessions}</p>
                      {userData.remainingSessions < 1 && (
                        <p className="text-xs text-red-600 mt-1">You need at least 1 session to book a class.</p>
                      )}
                    </div>
                    
                    <Form {...form}>
                      <form className="space-y-4">
                        <FormField
                          control={form.control}
                          name="acceptTerms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  I understand that I must cancel at least {systemSettings.cancellationTimeLimit} hours before 
                                  the class starts or I will lose my session credit.
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </>
                )}
              </div>
            )}
            
            <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
              <Button 
                variant="outline"
                onClick={cancelBookingConfirmation}
              >
                {isClassAlreadyBooked ? 'Close' : 'Cancel'}
              </Button>
              
              {!isClassAlreadyBooked && (
                <Button 
                  onClick={confirmBooking}
                  disabled={!form.watch('acceptTerms') || userData.remainingSessions < 1 || isBookingInProgress}
                  className="bg-purple-700 hover:bg-purple-800"
                >
                  {isBookingInProgress ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      Confirm Booking
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ClassCalendar;
