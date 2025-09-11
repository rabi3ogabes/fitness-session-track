import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  format,
  isSameDay,
  isAfter,
  addDays,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isBefore,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  MapPin,
  Star,
  CheckCircle2,
  X,
  RefreshCw,
  WifiOff,
  Calendar as CalendarIcon,
  User,
  Dumbbell,
  Activity,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Alert, AlertDescription } from "@/components/ui/alert";

// Class type colors using semantic tokens
const classTypeColors = {
  "upper body": {
    bg: "bg-teal-100 dark:bg-teal-900/20",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
    dot: "bg-teal-500",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300",
    card: "bg-teal-50/50 hover:bg-teal-100/50 dark:bg-teal-900/10 dark:hover:bg-teal-900/20",
    ring: "ring-teal-200 dark:ring-teal-800",
  },
  "lower body": {
    bg: "bg-purple-100 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
    card: "bg-purple-50/50 hover:bg-purple-100/50 dark:bg-purple-900/10 dark:hover:bg-purple-900/20",
    ring: "ring-purple-200 dark:ring-purple-800",
  },
  "bands": {
    bg: "bg-orange-100 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
    card: "bg-orange-50/50 hover:bg-orange-100/50 dark:bg-orange-900/10 dark:hover:bg-orange-900/20",
    ring: "ring-orange-200 dark:ring-orange-800",
  },
  yoga: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary",
    card: "bg-primary/5 hover:bg-primary/10",
    ring: "ring-primary/20",
  },
  workout: {
    bg: "bg-emerald-100 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
    card: "bg-emerald-50/50 hover:bg-emerald-100/50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20",
    ring: "ring-emerald-200 dark:ring-emerald-800",
  },
  combat: {
    bg: "bg-red-100 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
    card: "bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/10 dark:hover:bg-red-900/20",
    ring: "ring-red-200 dark:ring-red-800",
  },
  dance: {
    bg: "bg-pink-100 dark:bg-pink-900/20",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800",
    dot: "bg-pink-500",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300",
    card: "bg-pink-50/50 hover:bg-pink-100/50 dark:bg-pink-900/10 dark:hover:bg-pink-900/20",
    ring: "ring-pink-200 dark:ring-pink-800",
  },
  default: {
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    border: "border-muted",
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground",
    card: "bg-muted/30 hover:bg-muted/50",
    ring: "ring-muted",
  },
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

// System settings
const systemSettings = {
  cancellationTimeLimit: 4, // hours before class starts
};

const ClassCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [classes, setClasses] = useState<ClassWithBooking[]>([]);
  const [bookedClasses, setBookedClasses] = useState<number[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassWithBooking | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: "User",
    remainingSessions: 0,
    totalSessions: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [isNetworkConnected, setIsNetworkConnected] = useState(navigator.onLine);

  const { toast } = useToast();
  const { user } = useAuth();

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkConnected(true);
      if (error) handleRetry();
    };
    const handleOffline = () => setIsNetworkConnected(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [error]);

  // Get upcoming classes
  const upcomingClasses = useMemo(() => {
    const now = new Date();
    return classes
      .filter((cls) => {
        const classDate = new Date(cls.schedule);
        return isAfter(classDate, now) || isSameDay(classDate, now);
      })
      .sort((a, b) => {
        const dateA = new Date(a.schedule);
        const dateB = new Date(b.schedule);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return a.start_time && b.start_time
          ? a.start_time.localeCompare(b.start_time)
          : 0;
      });
  }, [classes]);

  // Get booked classes
  const myBookedClasses = useMemo(() => {
    return upcomingClasses.filter((cls) => 
      cls.isBooked === true || bookedClasses.includes(cls.id)
    );
  }, [upcomingClasses, bookedClasses]);

  // Calculate if sessions are low (25% or less)
  const sessionsLow = userData.remainingSessions <= Math.max(1, userData.totalSessions * 0.25);

  // Fetch user data from Supabase
  const fetchUserData = async () => {
    if (!user) return;

    try {
      if (!isNetworkConnected) {
        setError("You are currently offline. Reconnect to load your profile data.");
        return;
      }

      setError(null);
      const { data, error: profileError } = await supabase
        .from("members")
        .select("name, total_sessions, remaining_sessions, sessions")
        .eq("email", user.email)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          // Profile not found, use default values
          setUserData({
            name: user.email || "User",
            remainingSessions: 10,
            totalSessions: 20,
          });
          return;
        }
        throw profileError;
      }

      setUserData({
        name: data.name || user.email || "User",
        remainingSessions: data.remaining_sessions || 0,
        totalSessions: data.total_sessions || data.sessions || 0,
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Unable to load your profile data. Please try again.");
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user, isNetworkConnected]);

  // Fetch classes from Supabase
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);

      try {
        if (!isNetworkConnected) {
          setError("You're offline. Please check your connection.");
          return;
        }

        setError(null);
        const { data, error } = await supabase
          .from("classes")
          .select("*")
          .eq("status", "Active")
          .order("schedule", { ascending: true });

        if (error) {
          console.error("Error fetching classes:", error);
          throw error;
        }

        if (data) {
          // Fetch real enrollment count for each class
          const classesWithRealEnrollment = await Promise.all(
            data.map(async (cls: ClassModel) => {
              try {
                const { data: bookings, error: bookingError } = await supabase
                  .from("bookings")
                  .select("id")
                  .eq("class_id", cls.id)
                  .eq("status", "confirmed");

                if (bookingError) {
                  console.error("Error fetching bookings for class", cls.id, bookingError);
                  return { ...cls, enrolled: 0 };
                }

                const realEnrolled = bookings?.length || 0;
                console.log(`Class ${cls.id} (${cls.name}): DB enrolled=${cls.enrolled}, Real enrolled=${realEnrolled}`);
                
                // Transform and add type property based on class name
                let type = "default";
                const name = cls.name.toLowerCase().trim();
                
                console.log('Processing class:', cls.name, 'normalized:', name, 'real enrolled:', realEnrolled);

                if (name.includes("upper body") || name.includes("upper-body") || name === "upper body") {
                  type = "upper body";
                } else if (name.includes("lower body") || name.includes("lower-body") || name === "lower body") {
                  type = "lower body";
                } else if (name.includes("bands") || name.includes("band") || name === "bands") {
                  type = "bands";
                } else if (name.includes("yoga") || name.includes("pilates")) {
                  type = "yoga";
                } else if (name.includes("boxing") || name.includes("mma") || name.includes("martial")) {
                  type = "combat";
                } else if (name.includes("zumba") || name.includes("dance")) {
                  type = "dance";
                } else if (name.includes("workout") || name.includes("training") || name.includes("hiit") || name.includes("cardio") || name.includes("strength")) {
                  type = "workout";
                }
                
                console.log('Assigned type:', type, 'to class:', cls.name);

                return { 
                  ...cls, 
                  type, 
                  isBooked: false, 
                  enrolled: realEnrolled 
                };
              } catch (err) {
                console.error("Error processing class:", cls.id, err);
                return { ...cls, type: "default", isBooked: false, enrolled: 0 };
              }
            })
          );

          setClasses(classesWithRealEnrollment);
        }
      } catch (err) {
        console.error("Error fetching classes:", err);
        setError("Failed to load classes from the server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [isNetworkConnected]);

  // Fetch user bookings from Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user || !isNetworkConnected) return;

      try {
        setBookedClasses([]);

        const { data, error } = await supabase
          .from("bookings")
          .select("class_id")
          .eq("user_id", user.id)
          .eq("status", "confirmed");

        if (error) {
          console.error("Error fetching bookings:", error);
          throw error;
        }

        if (data && data.length > 0) {
          const bookedClassIds = data.map((booking) => booking.class_id);
          setBookedClasses(bookedClassIds);

          // Mark booked classes in the classes array
          setClasses((prevClasses) =>
            prevClasses.map((cls) => ({
              ...cls,
              isBooked: bookedClassIds.includes(cls.id),
            }))
          );
        } else {
          setBookedClasses([]);
          setClasses((prevClasses) =>
            prevClasses.map((cls) => ({
              ...cls,
              isBooked: false,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    };

    fetchBookings();
  }, [user, isNetworkConnected]);

  // Get classes for a specific date
  const getClassesForDate = (date: Date) => {
    return classes
      .filter((cls) => {
        const classDate = new Date(cls.schedule);
        return isSameDay(classDate, date);
      })
      .sort((a, b) => {
        if (a.start_time && b.start_time) {
          return a.start_time.localeCompare(b.start_time);
        }
        return 0;
      });
  };

  // Navigation functions
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleSelectClass = (cls: ClassWithBooking) => {
    setSelectedClass(cls);
    if (cls.isBooked) {
      setConfirmDialogOpen(true); // For cancellation
    } else {
      setBookingDialogOpen(true); // For booking
    }
  };

  const handleBooking = async () => {
    if (!selectedClass || !user) return;

    if (userData.remainingSessions < 1) {
      toast({
        title: "Not enough sessions",
        description: "You need at least 1 session to book a class.",
        variant: "destructive",
      });
      setConfirmDialogOpen(false);
      return;
    }

    setIsBookingInProgress(true);

    try {
      if (!isNetworkConnected) {
        toast({
          title: "You're offline",
          description: "Bookings cannot be processed while offline.",
          variant: "destructive",
        });
        setIsBookingInProgress(false);
        return;
      }

      // Check if already booked
      if (bookedClasses.includes(selectedClass.id)) {
        toast({
          title: "Already booked",
          description: "You have already booked this class.",
          variant: "destructive",
        });
        setIsBookingInProgress(false);
        setConfirmDialogOpen(false);
        return;
      }

      // Insert booking
      const { error } = await supabase.from("bookings").insert({
        user_name: user.name,
        user_id: user.id,
        class_id: selectedClass.id,
        status: "confirmed",
        booking_date: new Date().toISOString(),
      });

      if (error) throw error;

      // Update enrolled count with real count from bookings
      const { data: currentBookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("class_id", selectedClass.id)
        .eq("status", "confirmed");
      
      const realEnrolledCount = (currentBookings?.length || 0) + 1; // +1 for the new booking
      const { error: updateError } = await supabase
        .from("classes")
        .update({ enrolled: realEnrolledCount })
        .eq("id", selectedClass.id);

      if (updateError) {
        console.error("Error updating enrolled count:", updateError);
      }

      // Update local state
      setBookedClasses([...bookedClasses, selectedClass.id]);
      setClasses((prevClasses) =>
        prevClasses.map((cls) => ({
          ...cls,
          isBooked: cls.id === selectedClass.id ? true : cls.isBooked,
          enrolled: cls.id === selectedClass.id ? (cls.enrolled || 0) + 1 : cls.enrolled,
        }))
      );

      // Refresh user data to update session balance
      await fetchUserData();

      toast({
        title: "Class booked successfully!",
        description: `You've booked ${selectedClass.name}.`,
      });

      setSelectedClass(null);
      setConfirmDialogOpen(false);
      setBookingDialogOpen(false);
    } catch (err) {
      console.error("Error booking class:", err);
      toast({
        title: "Failed to book class",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsBookingInProgress(false);
    }
  };

  const handleCancelBooking = async (classId: number, classTime: string, className: string) => {
    if (!user) return;

    try {
      const classToCancel = classes.find((cls) => cls.id === classId);
      if (!classToCancel) {
        toast({
          title: "Error",
          description: "Could not find class details",
          variant: "destructive",
        });
        return;
      }

      // Check cancellation window
      const classHour = parseInt(classTime.split(":")[0]);
      const classMinute = parseInt(classTime.split(":")[1] || "0");
      const now = new Date();
      const classDate = new Date(classToCancel.schedule);
      classDate.setHours(classHour, classMinute, 0, 0);

      const hoursDifference = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Allow cancellation for past classes (within 24 hours) or future classes outside the cancellation window
      const isRecentPastClass = hoursDifference < 0 && Math.abs(hoursDifference) <= 24;
      const isFutureClassWithinLimit = hoursDifference >= 0 && hoursDifference < systemSettings.cancellationTimeLimit;

      if (isFutureClassWithinLimit) {
        toast({
          title: "Cannot cancel class",
          description: `You can only cancel future classes ${systemSettings.cancellationTimeLimit} hours or more before they start.`,
          variant: "destructive",
        });
        return;
      }

      if (!isNetworkConnected) {
        toast({
          title: "You're offline",
          description: "Cancellations cannot be processed while offline.",
          variant: "destructive",
        });
        return;
      }

      const cancellationSuccess = await cancelClassBooking(user.id, classId);

      if (!cancellationSuccess) {
        toast({
          title: "Failed to cancel booking",
          description: "There was an error cancelling your booking.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setBookedClasses((prev) => prev.filter((id) => id !== classId));
      setClasses((prevClasses) =>
        prevClasses.map((cls) => ({
          ...cls,
          isBooked: cls.id === classId ? false : cls.isBooked,
          enrolled: cls.id === classId && cls.enrolled ? cls.enrolled - 1 : cls.enrolled,
        }))
      );

      // Refresh user data to update session balance
      await fetchUserData();

      toast({
        title: "Class cancelled",
        description: `You've successfully cancelled your ${className} class.`,
      });
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast({
        title: "Failed to cancel booking",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      setError(null);
      setIsNetworkConnected(navigator.onLine);
    }, 500);
  };

  // Check if a class is in the past
  const isClassInPast = (classDate: Date, classTime?: string) => {
    if (!classTime) return false;
    const now = new Date();
    const [hours, minutes] = classTime.split(":").map(Number);
    const classDateTime = new Date(classDate);
    classDateTime.setHours(hours, minutes);
    return classDateTime < now;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const calendarDays = generateCalendarDays();
  const selectedDateClasses = getClassesForDate(selectedDate);

  return (
    <DashboardLayout title="Class Calendar">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Class Calendar</h1>
              <p className="text-muted-foreground">Book your fitness classes</p>
            </div>
            
            {/* Session Info */}
            <div className="flex items-center gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Sessions:</span>
                  <span className={cn("font-semibold", sessionsLow ? "text-destructive" : "text-primary")}>
                    {userData.remainingSessions}
                  </span>
                </div>
              </Card>
              
              {!isNetworkConnected && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  {retrying ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Retry"}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Session Warning */}
          {sessionsLow && (
            <Alert>
              <AlertDescription>
                You're running low on sessions ({userData.remainingSessions} remaining). Consider purchasing more to continue booking classes.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <Skeleton key={j} className="h-12 w-full" />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-2">
                       {calendarDays.map((day) => {
                        const dayClasses = getClassesForDate(day);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentDay = isToday(day);
                        const isPastDay = isBefore(day, new Date()) && !isToday(day);
                        
                        // Check if user has booked classes on this day
                        const hasBookedClasses = dayClasses.some(cls => 
                          cls.isBooked === true || bookedClasses.includes(cls.id)
                        );

                        return (
                          <Button
                            key={day.toISOString()}
                            variant={isSelected ? "default" : "ghost"}
                            className={cn(
                              "h-14 p-1 flex flex-col items-center justify-center relative",
                              !isCurrentMonth && "text-muted-foreground opacity-50",
                              isCurrentDay && !isSelected && "ring-2 ring-primary/20",
                              isPastDay && "opacity-50",
                              dayClasses.length > 0 && "font-medium",
                              hasBookedClasses && "bg-green-100 hover:bg-green-200 border-2 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-600"
                            )}
                            onClick={() => setSelectedDate(day)}
                          >
                            <span className="text-sm">{format(day, "d")}</span>
                            
                            {/* Class indicators */}
                            {dayClasses.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {dayClasses.slice(0, 3).map((cls) => {
                                  const typeKey = (cls.type || "default") as keyof typeof classTypeColors;
                                  const typeColor = classTypeColors[typeKey] || classTypeColors.default;
                                  console.log('Class type:', cls.type, 'Color:', typeColor.dot, 'Class name:', cls.name);
                                  
                                  // Choose icon based on class type
                                  const IconComponent = cls.type === "upper body" ? Dumbbell :
                                                      cls.type === "lower body" ? Activity :
                                                      cls.type === "bands" ? Zap :
                                                      Dumbbell;
                                  
                                  return (
                                    <IconComponent
                                      key={cls.id}
                                      className={cn("w-3 h-3", typeColor.text)}
                                    />
                                  );
                                })}
                                {dayClasses.length > 3 && (
                                  <span className="text-xs text-muted-foreground">+{dayClasses.length - 3}</span>
                                )}
                               </div>
                             )}
                             
                             {/* Booked session indicator */}
                             {hasBookedClasses && (
                               <div className="absolute top-1 right-1">
                                 <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                               </div>
                             )}
                           </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Classes for selected date */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {format(selectedDate, "EEEE, MMM d")}
                </CardTitle>
                <p className="text-xs text-red-600 font-bold mt-1">
                  Click here to book/cancel the session
                </p>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {selectedDateClasses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No classes scheduled for this date
                  </p>
                ) : (
                  selectedDateClasses.map((cls) => {
                    const typeKey = (cls.type || "default") as keyof typeof classTypeColors;
                    const typeColor = classTypeColors[typeKey] || classTypeColors.default;
                    const isBooked = cls.isBooked || bookedClasses.includes(cls.id);
                    const isPast = isClassInPast(new Date(cls.schedule), cls.start_time);
                    const isFull = cls.enrolled >= cls.capacity;
                    const availableSpots = cls.capacity - (cls.enrolled || 0);

                    return (
                      <Card
                        key={cls.id}
                        className={cn(
                          "cursor-pointer transition-all duration-200",
                          typeColor.card,
                          isBooked && "ring-2 ring-primary/50",
                          isPast && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => !isPast && handleSelectClass(cls)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{cls.name}</h3>
                                {isBooked && (
                                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Booked
                                  </Badge>
                                )}
                                {isFull && !isBooked && (
                                  <Badge variant="destructive">Full</Badge>
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {cls.start_time && cls.end_time
                                      ? `${cls.start_time} - ${cls.end_time}`
                                      : "Time not set"}
                                  </span>
                                </div>
                                
                                {cls.trainer && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    <span>{cls.trainer}</span>
                                  </div>
                                )}
                                
                                {cls.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    <span>{cls.location}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    {cls.enrolled || 0}/{cls.capacity} enrolled
                                    {availableSpots > 0 && !isBooked && (
                                      <span className="text-primary ml-1">
                                        ({availableSpots} spots left)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <Badge className={cn(typeColor.badge)}>
                              {cls.type || "default"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* My Bookings */}
            {myBookedClasses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    My Upcoming Bookings
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {myBookedClasses.slice(0, 3).map((cls) => {
                    const isPast = isClassInPast(new Date(cls.schedule), cls.start_time);
                    const canCancel = cls.start_time && (() => {
                      const classHour = parseInt(cls.start_time.split(":")[0]);
                      const classMinute = parseInt(cls.start_time.split(":")[1] || "0");
                      const now = new Date();
                      const classDate = new Date(cls.schedule);
                      classDate.setHours(classHour, classMinute, 0, 0);
                      const hoursDifference = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                      
                      // Allow cancellation for recent past classes (within 24 hours) or future classes outside the limit
                      const isRecentPastClass = hoursDifference < 0 && Math.abs(hoursDifference) <= 24;
                      const isFutureClass = hoursDifference >= systemSettings.cancellationTimeLimit;
                      
                      return isRecentPastClass || isFutureClass;
                    })();

                    return (
                      <Card key={cls.id} className="border-primary/20">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{cls.name}</h4>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(cls.schedule), "MMM d")} • {cls.start_time} - {cls.end_time}
                              </div>
                            </div>
                            
                            {canCancel && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelBooking(cls.id, cls.start_time!, cls.name)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Booking Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedClass && (bookedClasses.includes(selectedClass.id) || selectedClass.isBooked)
                  ? "Class Already Booked"
                  : "Confirm Booking"}
              </DialogTitle>
              <DialogDescription>
                {selectedClass && (
                  <div className="space-y-3 pt-2">
                    <div className="text-base font-medium">{selectedClass.name}</div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Date:</strong> {format(new Date(selectedClass.schedule), "EEEE, MMMM d, yyyy")}</p>
                      <p><strong>Time:</strong> {selectedClass.start_time} - {selectedClass.end_time}</p>
                      {selectedClass.trainer && <p><strong>Trainer:</strong> {selectedClass.trainer}</p>}
                      {selectedClass.location && <p><strong>Location:</strong> {selectedClass.location}</p>}
                      <p><strong>Available spots:</strong> {selectedClass.capacity - (selectedClass.enrolled || 0)}</p>
                    </div>
                    
                    {bookedClasses.includes(selectedClass.id) || selectedClass.isBooked ? (
                      <p className="text-primary">You have already booked this class.</p>
                    ) : (
                      <p>This will use 1 of your {userData.remainingSessions} remaining sessions.</p>
                    )}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </Button>
              {selectedClass && !(bookedClasses.includes(selectedClass.id) || selectedClass.isBooked) && (
                <Button
                  onClick={handleBooking}
                  disabled={isBookingInProgress || userData.remainingSessions < 1}
                >
                  {isBookingInProgress ? "Booking..." : "Confirm Booking"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Booking Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Book Class
              </DialogTitle>
              <DialogDescription>
                Confirm your class booking details below.
              </DialogDescription>
            </DialogHeader>
            
            {selectedClass && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedClass.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedClass.trainer}</p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs",
                        classTypeColors[selectedClass.type as keyof typeof classTypeColors]?.badge || 
                        classTypeColors.default.badge
                      )}
                    >
                      {selectedClass.type?.toUpperCase() || 'CLASS'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(selectedClass.schedule), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClass.start_time} - {selectedClass.end_time}</span>
                    </div>
                    {selectedClass.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedClass.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClass.capacity - (selectedClass.enrolled || 0)} spots left</span>
                    </div>
                  </div>
                  
                  {selectedClass.description && (
                    <p className="text-sm text-muted-foreground border-t pt-3">
                      {selectedClass.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Sessions remaining:</span>
                  </div>
                  <Badge variant={userData.remainingSessions > 0 ? "default" : "destructive"}>
                    {userData.remainingSessions}
                  </Badge>
                </div>

                {userData.remainingSessions < 1 && (
                  <Alert>
                    <AlertDescription>
                      You don't have enough sessions to book this class. Please purchase a membership to continue.
                    </AlertDescription>
                  </Alert>
                )}

                {sessionsLow && userData.remainingSessions > 0 && (
                  <Alert>
                    <AlertDescription>
                      You're running low on sessions! Consider purchasing more sessions soon.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setBookingDialogOpen(false)}
                disabled={isBookingInProgress}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBooking}
                disabled={isBookingInProgress || userData.remainingSessions < 1}
                className="min-w-[100px]"
              >
                {isBookingInProgress ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Booking...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Book Class
                  </div>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ClassCalendar;