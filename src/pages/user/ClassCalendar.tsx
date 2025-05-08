import { useState, useEffect, useRef } from "react";
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
import { supabase, cancelClassBooking } from "@/integrations/supabase/client";
import { ClassModel } from "@/pages/admin/components/classes/ClassTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Checkbox } from "@/components/ui/checkbox";

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
  const [isClassAlreadyBooked, setIsClassAlreadyBooked] = useState(false);
  
  // Ref to track if we need to refresh data after a cancellation
  const pendingRefresh = useRef(false);

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
            pendingRefresh.current = false;
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
  }, [isNetworkConnected, pendingRefresh.current]);
  
  // Fetch user bookings from Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      try {
        // Clear previous bookings to prevent stale data
        setBookedClasses([]);
        
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
          // Use the latest data from the server, not cached data
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
            
            console.log("Booked classes found:", bookedClassIds);
          } else {
            console.log("No bookings found for user");
            // No bookings found
            setBookedClasses([]);
            
            // Remove booked flag from all classes
            setClasses(prevClasses => 
              prevClasses.map(cls => ({
                ...cls,
                isBooked: false
              }))
            );
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
  }, [user, isNetworkConnected, pendingRefresh.current]);
  
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
    
    // Check both ways to ensure accurate booking status detection
    const isBooked = cls.isBooked || bookedClasses.includes(cls.id);
    
    // Set the state to control dialog display
    setIsClassAlreadyBooked(isBooked);
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
      // FIX: Double check that class isn't already booked before proceeding
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
      setBookedClasses(prevBookedClasses => [...prevBookedClasses, selectedClass.id]);
      
      // Update classes to mark as booked
      setClasses(prevClasses => 
        prevClasses.map(cls => ({
          ...cls,
          isBooked: cls.id === selectedClass.id ? true : cls.isBooked || bookedClasses.includes(cls.id),
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
  
  // Enhanced cancel booking function with better data sync
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
      
      // Special handling for demo user
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
      
      // Use the helper function to cancel the booking
      const cancellationSuccess = await cancelClassBooking(user.id, classId);
      
      if (!cancellationSuccess) {
        throw new Error("Failed to cancel booking");
      }
      
      // Update local state immediately to show the cancellation
      setBookedClasses(prevBookedClasses => prevBookedClasses.filter(id => id !== classId));
      
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
      
      // Set the flag to refresh data on next render cycle
      pendingRefresh.current = true;
      
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
  
  // FIX: Combine both booking indicators to correctly identify booked classes
  const myBookedClasses = allClasses.filter(cls => {
    return cls.isBooked === true || bookedClasses.includes(cls.id);
  });
  
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
    // FIX: Check both ways to ensure accurate booking status detection
    const isBooked = cls.isBooked || bookedClasses.includes(cls.id);
    const typeKey = (cls.type || 'default') as keyof typeof classTypeColors;
    const typeColor = classTypeColors[typeKey] || classTypeColors.default;
    const isPast = isClassInPast(new Date(cls.schedule), cls.start_time);
    
    return (
      <div 
        key={cls.id}
        className={cn(
          "p-2 rounded-md mb-1.5 text-sm cursor-pointer transition-all hover:shadow-sm",
          isBooked ? `${typeColor.bg} border border-purple-300` : `${typeColor.bg}`,
          isPast && "opacity-60"
        )}
        onClick={() => !isPast && handleSelectClass(cls)}
      >
        <div className="flex justify-between items-center">
          <div className="font-medium truncate">{cls.name}</div>
          {isBooked && <Check className="h-3.5 w-3.5 text-purple-600" />}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Class Calendar">
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekView">
              <CalendarDays className="h-4 w-4 mr-2" />
              Week View
            </TabsTrigger>
            <TabsTrigger value="myBookings">
              <CalendarCheck className="h-4 w-4 mr-2" />
              My Bookings
            </TabsTrigger>
          </TabsList>
          
          {/* Week View Content */}
          <TabsContent value="weekView" className="space-y-4">
            {/* Week View Calendar */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">Class Schedule</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      onClick={handlePreviousWeek} 
                      variant="outline" 
                      size="icon"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      {format(weekViewDate, 'MMM d')} - {format(addDays(weekViewDate, 6), 'MMM d')}
                    </span>
                    <Button 
                      onClick={handleNextWeek} 
                      variant="outline" 
                      size="icon"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Render week days */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-md text-center",
                        isToday(day) && "bg-purple-50 font-bold"
                      )}
                    >
                      <span className="text-xs text-gray-500">{format(day, 'EEE')}</span>
                      <span className={cn(
                        "font-semibold text-sm w-7 h-7 flex items-center justify-center rounded-full",
                        isToday(day) && "bg-purple-600 text-white"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Render classes for each weekday */}
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day, i) => {
                    const classesForDay = getClassesForDay(day);
                    return (
                      <div 
                        key={i}
                        className={cn(
                          "min-h-28 p-1 rounded-md border",
                          isToday(day) ? "bg-purple-50 border-purple-200" : "bg-white border-gray-100"
                        )}
                      >
                        {isLoading ? (
                          <div className="space-y-1">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                          </div>
                        ) : (
                          <>
                            {classesForDay.length === 0 ? (
                              <div className="text-xs text-gray-400 text-center h-full flex items-center justify-center p-2">
                                No classes
                              </div>
                            ) : (
                              classesForDay.map(cls => renderWeekDayClass(cls))
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* My Bookings Tab Content */}
          <TabsContent value="myBookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">My Booked Classes</CardTitle>
                {myBookedClasses.length > 0 && (
                  <p className="text-sm text-gray-500">
                    You have {myBookedClasses.length} upcoming booked {myBookedClasses.length === 1 ? 'class' : 'classes'}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {!isNetworkConnected && (
                  <Alert className="mb-4" variant="destructive">
                    <WifiOff className="h-4 w-4" />
                    <AlertTitle>You're offline</AlertTitle>
                    <AlertDescription>
                      Some features may be limited until you reconnect.
                    </AlertDescription>
                  </Alert>
                )}
              
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <>
                    {myBookedClasses.length > 0 ? (
                      <div className="space-y-3">
                        {myBookedClasses.map(cls => {
                          const classDate = new Date(cls.schedule);
                          const isPastCancellationLimit = isPastCancellationWindow(cls);
                          
                          return (
                            <div 
                              key={cls.id} 
                              className="p-4 border rounded-lg bg-purple-50 border-purple-200"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg">{cls.name}</h3>
                                  <p className="text-gray-600">{format(classDate, 'EEEE, MMMM d')}</p>
                                  <div className="mt-1 flex items-center text-sm">
                                    <Clock className="h-4 w-4 mr-1 text-gray-600" />
                                    <span>{cls.start_time} - {cls.end_time}</span>
                                  </div>
                                  <div className="mt-1 flex items-center text-sm">
                                    <Users className="h-4 w-4 mr-1 text-gray-600" />
                                    <span>
                                      {cls.enrolled}/{cls.capacity} enrolled
                                    </span>
                                  </div>
                                </div>
                                <Button 
                                  onClick={() => handleCancelBooking(cls.id, cls.start_time || '', cls.name)}
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  disabled={isPastCancellationLimit}
                                >
                                  Cancel
                                </Button>
                              </div>
                              {isPastCancellationLimit && (
                                <Alert className="mt-2" variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Cannot cancel</AlertTitle>
                                  <AlertDescription>
                                    Cancellations must be made at least {systemSettings.cancellationTimeLimit} hours before the class.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center p-6 border rounded-lg">
                        <CalendarIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">No Booked Classes</h3>
                        <p className="text-gray-500 mt-1">You haven't booked any classes yet</p>
                        <Button 
                          onClick={() => setActiveTab('weekView')} 
                          className="mt-4"
                        >
                          Browse Classes
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* User Session Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Your Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-600">Available Sessions</h4>
                    <p className={cn(
                      "text-2xl font-bold", 
                      sessionsLow ? "text-amber-600" : "text-green-600"
                    )}>
                      {userData.remainingSessions}
                    </p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-medium text-gray-600">Total Package</h4>
                    <p className="text-2xl font-bold text-gray-800">
                      {userData.totalSessions}
                    </p>
                  </div>
                </div>
                
                {sessionsLow && (
                  <Alert className="mt-3" variant="default">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Running Low</AlertTitle>
                    <AlertDescription>
                      You're running low on sessions. Consider purchasing more soon.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Loading and Error States */}
        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex flex-col space-y-2">
              <p>{error}</p>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={retrying}
                className="self-start"
              >
                {retrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Class Booking Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isClassAlreadyBooked ? 'Class Already Booked' : 'Confirm Class Booking'}
            </DialogTitle>
            <DialogDescription>
              {selectedClass?.name} - {selectedClass?.schedule && format(new Date(selectedClass.schedule), 'EEEE, MMMM d')} at {selectedClass?.start_time}
            </DialogDescription>
          </DialogHeader>
          
          {isClassAlreadyBooked ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <p>You're already booked for this class!</p>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>If you need to cancel this booking, you can do it right here or go to the "My Bookings" tab.</p>
              </div>
              
              <DialogFooter className="flex sm:justify-between">
                <Button 
                  variant="outline" 
                  onClick={cancelBookingConfirmation}
                >
                  Close
                </Button>
                {selectedClass && (
                  <Button 
                    onClick={() => {
                      setConfirmDialogOpen(false);
                      if (selectedClass) {
                        handleCancelBooking(selectedClass.id, selectedClass.start_time || '', selectedClass.name);
                      }
                    }}
                    variant="destructive"
                    size="sm"
                    className="text-white"
                    disabled={selectedClass ? isPastCancellationWindow(selectedClass) : false}
                  >
                    Cancel Session
                  </Button>
                )}
              </DialogFooter>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(confirmBooking)} className="space-y-4">
                <div className="grid gap-4 py-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{selectedClass?.enrolled} / {selectedClass?.capacity} enrolled</p>
                      <p className="text-sm text-gray-500">Trainer: {selectedClass?.trainer}</p>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="font-medium mb-1">Session Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Available sessions: <span className="font-semibold">{userData.remainingSessions}</span></p>
                      <p>Required for this booking: <span className="font-semibold">1</span></p>
                    </div>
                  </div>
                  
                  {userData.remainingSessions < 1 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Not enough sessions</AlertTitle>
                      <AlertDescription>
                        You need at least 1 available session to book this class.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={userData.remainingSessions < 1}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I understand this will use 1 session from my account
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            You can cancel up to {systemSettings.cancellationTimeLimit} hours before the class starts.
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={cancelBookingConfirmation}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isBookingInProgress || userData.remainingSessions < 1}
                  >
                    {isBookingInProgress ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Book Class'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClassCalendar;
