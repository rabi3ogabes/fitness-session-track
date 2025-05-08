
import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO, isToday, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, RefreshCw, Calendar as CalendarIcon, Clock, MapPin, Users, ArrowLeft, ArrowRight, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase, requireAuth, isOffline, cacheDataForOffline, cancelClassBooking } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingIndicator from "@/components/LoadingIndicator";

interface Class {
  id: number;
  name: string;
  trainer: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enrolled: number;
  location: string;
  booked: boolean;
}

interface UserData {
  id: string;
  email: string;
  name: string;
}

const ClassCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [classes, setClasses] = useState<Class[]>([]);
  const [bookedClasses, setBookedClasses] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isNetworkConnected, setIsNetworkConnected] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const startOfMonth = startOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  const endOfMonth = endOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
  
  // Use an incrementing trigger to force data refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser } = useAuth();
  
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email || "",
      });
    }
  }, [authUser]);
  
  // Fetch user data
  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }
      
      if (data) {
        setUserData({
          id: user.id,
          email: data.email,
          name: data.name,
        });
      }
    } catch (error) {
      console.error("Unexpected error fetching user data:", error);
    }
  };
  
  useEffect(() => {
    fetchUserData();
  }, [user]);
  
  // Network status event listeners with better handling
  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkConnected(true);
      toast({
        title: "You're back online!",
        description: "Refreshing data from server...",
      });
      // Auto retry fetch on reconnect
      setRefreshTrigger(prev => prev + 1);
    };
    
    const handleOffline = () => {
      setIsNetworkConnected(false);
      toast({
        title: "You're offline",
        description: "Using cached data. Some features may be limited.",
        variant: "destructive",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial network status
    setIsNetworkConnected(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);
  
  // Fetch classes from Supabase - enhanced with better caching and error handling
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      setError(null);
      
      if (!isNetworkConnected) {
        console.log("Offline: Loading classes from cache");
        loadClassesFromCache();
        setIsLoading(false);
        return;
      }

      try {
        // Clear any cached status before fetching fresh data
        sessionStorage.removeItem('last_classes_fetch');
        console.log(`Fetching classes (refresh #${refreshTrigger})...`);
        
        const { data, error } = await supabase
          .from("classes")
          .select("*")
          .gte("schedule", format(startOfMonth, "yyyy-MM-dd"))
          .order("schedule", { ascending: true });

        if (error) {
          console.error("Error fetching classes:", error);
          setError(error.message);
          loadClassesFromCache(); // Try to load from cache as fallback
        } else {
          console.log(`Successfully fetched ${data.length} classes`);
          
          // Process classes with enrollment status
          const processedClasses = data.map(cls => ({
            id: cls.id,
            name: cls.name,
            trainer: cls.trainer || "Unknown",
            date: cls.schedule,
            startTime: cls.start_time || "09:00",
            endTime: cls.end_time || "10:00",
            capacity: cls.capacity || 10,
            enrolled: cls.enrolled || 0,
            location: cls.location || "Main Studio",
            booked: false // Will be updated later
          }));
          
          setClasses(processedClasses);
          cacheClasses(processedClasses);
          sessionStorage.setItem('last_classes_fetch', new Date().toISOString());
        }
      } catch (error: any) {
        console.error("Unexpected error fetching classes:", error);
        setError(`Failed to load classes: ${error.message}`);
        loadClassesFromCache();
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
    // The refreshTrigger dependency ensures the effect runs when we want to force a refresh
  }, [isNetworkConnected, refreshTrigger]);
  
  // Fetch user bookings with forced refresh mechanism
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      if (!isNetworkConnected) {
        console.log("Offline: Using cached bookings");
        const cachedBookings = localStorage.getItem('user_bookings');
        if (cachedBookings) {
          try {
            const bookedClassIds = JSON.parse(cachedBookings);
            setBookedClasses(bookedClassIds);
            
            // Mark classes as booked in the classes array
            setClasses(prevClasses => {
              const updatedClasses = [...prevClasses];
              updatedClasses.forEach(cls => {
                cls.booked = bookedClassIds.includes(cls.id);
              });
              return updatedClasses;
            });
            return;
          } catch (e) {
            console.warn("Error parsing cached bookings:", e);
          }
        }
        return;
      }
      
      try {
        console.log(`Fetching bookings (refresh #${refreshTrigger})...`);
        // Add cache control headers to force fresh data
        const { data, error } = await supabase
          .from('bookings')
          .select('class_id, status')
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .order('class_id', { ascending: true });
        
        if (error) {
          console.error("Error fetching bookings:", error);
          setError(`Failed to load your bookings: ${error.message}`);
          return;
        }
        
        if (data) {
          const bookedClassIds = data.map(booking => booking.class_id);
          console.log("User has booked these classes:", bookedClassIds);
          
          // Cache the booking data
          localStorage.setItem('user_bookings', JSON.stringify(bookedClassIds));
          
          // Update state
          setBookedClasses(bookedClassIds);
          
          // Mark classes as booked in the classes array
          setClasses(prevClasses => {
            const updatedClasses = [...prevClasses];
            updatedClasses.forEach(cls => {
              cls.booked = bookedClassIds.includes(cls.id);
            });
            return updatedClasses;
          });
        }
      } catch (error: any) {
        console.error("Unexpected error fetching bookings:", error);
        setError(`Failed to load your bookings: ${error.message}`);
      }
    };

    fetchBookings();
  }, [user, isNetworkConnected, refreshTrigger]); // Added refreshTrigger dependency

  // Load classes from local storage
  const loadClassesFromCache = () => {
    const cachedClasses = localStorage.getItem('cached_classes');
    if (cachedClasses) {
      try {
        const parsedClasses = JSON.parse(cachedClasses);
        if (Array.isArray(parsedClasses)) {
          console.log(`Loaded ${parsedClasses.length} classes from cache`);
          setClasses(parsedClasses);
        } else {
          console.warn("Cached classes data is not an array");
        }
      } catch (error) {
        console.error("Error parsing cached classes:", error);
      }
    }
  };

  // Cache classes in local storage
  const cacheClasses = (classesToCache: Class[]) => {
    try {
      localStorage.setItem('cached_classes', JSON.stringify(classesToCache));
      console.log(`Cached ${classesToCache.length} classes`);
    } catch (error) {
      console.error("Error caching classes:", error);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getClassesForDate = (date: Date): Class[] => {
    return classes.filter((cls) => {
      const classDate = parseISO(cls.date);
      return (
        classDate.getFullYear() === date.getFullYear() &&
        classDate.getMonth() === date.getMonth() &&
        classDate.getDate() === date.getDate()
      );
    });
  };

  const isDateBooked = (date: Date): boolean => {
    return getClassesForDate(date).some((cls) => cls.booked);
  };

  const formatDate = (date: Date): string => {
    return format(date, "EEE, MMM d");
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const handleOpenBookingDetails = (cls: Class) => {
    setSelectedClass(cls);
    setIsBookingDetailsOpen(true);
  };
  
  // Completely rewritten cancel booking function with better error handling and refresh
  const handleCancelBooking = async (classId: number, classTime: string, className: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to cancel bookings",
        variant: "destructive",
      });
      return;
    }
    
    if (!isNetworkConnected) {
      toast({
        title: "You're offline",
        description: "Please connect to the internet to cancel bookings",
        variant: "destructive",
      });
      return;
    }
    
    setIsCancelling(true);
    
    try {
      console.log(`Attempting to cancel booking for class ${classId}, user ${user.id}`);
      
      // Use the enhanced cancelClassBooking function
      const success = await cancelClassBooking(user.id, classId);
      
      if (success) {
        console.log("Booking cancelled successfully");
        toast({
          title: "Booking cancelled",
          description: `You've cancelled your booking for ${className} at ${classTime}`,
        });
        
        // Update local state immediately for better user experience
        setBookedClasses(prev => prev.filter(id => id !== classId));
        setClasses(prev => 
          prev.map(cls => 
            cls.id === classId 
              ? { ...cls, booked: false, enrolled: Math.max(0, cls.enrolled - 1) } 
              : cls
          )
        );
        
        // Force a complete refresh of data from the server
        console.log("Triggering refresh after successful cancellation");
        setRefreshTrigger(prev => prev + 1);
      } else {
        console.error("Failed to cancel booking");
        toast({
          title: "Cancellation failed",
          description: "There was a problem cancelling your booking. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in handleCancelBooking:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
      setIsBookingDetailsOpen(false);
    }
  };

  const handleBookClass = async (classId: number, classTime: string, className: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book classes",
        variant: "destructive",
      });
      return;
    }
    
    if (!isNetworkConnected) {
      toast({
        title: "You're offline",
        description: "Please connect to the internet to book classes",
        variant: "destructive",
      });
      return;
    }
    
    setIsBooking(true);
    
    try {
      // Optimistically update the local state
      setBookedClasses(prev => [...prev, classId]);
      setClasses(prev =>
        prev.map(cls =>
          cls.id === classId ? { ...cls, booked: true, enrolled: cls.enrolled + 1 } : cls
        )
      );
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([{ user_id: user.id, class_id: classId, status: 'confirmed' }]);
        
      if (error) {
        console.error("Error booking class:", error);
        // Revert the optimistic update on error
        setBookedClasses(prev => prev.filter(id => id !== classId));
        setClasses(prev =>
          prev.map(cls =>
            cls.id === classId ? { ...cls, booked: false, enrolled: Math.max(0, cls.enrolled - 1) } : cls
          )
        );
        
        toast({
          title: "Booking failed",
          description: "There was a problem booking the class. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log("Class booked successfully:", data);
        toast({
          title: "Class booked",
          description: `You've booked ${className} at ${classTime}`,
        });
        
        // Force a complete refresh of data from the server
        console.log("Triggering refresh after successful booking");
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error in handleBookClass:", error);
      // Revert the optimistic update on error
      setBookedClasses(prev => prev.filter(id => id !== classId));
      setClasses(prev =>
        prev.map(cls =>
          cls.id === classId ? { ...cls, booked: false, enrolled: Math.max(0, cls.enrolled - 1) } : cls
        )
      );
      
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
      setIsBookingDetailsOpen(false);
    }
  };

  const renderCalendarDays = () => {
    const start = startOfWeek(startOfMonth);
    const end = endOfWeek(endOfMonth);
    const calendarDays = eachDayOfInterval({ start, end });

    return calendarDays.map((day) => {
      const dayClasses = getClassesForDate(day);
      const isBooked = isDateBooked(day);
      const isTodayDate = isToday(day);

      return (
        <div key={day.toISOString()} className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-9 w-9 p-0 font-normal text-muted-foreground data-[selected]:bg-accent data-[selected]:text-accent-foreground data-[disabled]:opacity-50",
                  isBooked && "text-sky-500",
                  isTodayDate && "font-semibold",
                  day.getMonth() !== currentDate.getMonth() &&
                    "text-muted-foreground opacity-50",
                    "hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 rounded-md",
                )}
                onClick={() => handleDateSelect(day)}
                disabled={day.getMonth() !== currentDate.getMonth()}
              >
                <time dateTime={format(day, "yyyy-MM-dd")}>
                  {format(day, "d")}
                </time>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <Card>
                <CardHeader>
                  <CardTitle>{formatDate(day)}</CardTitle>
                  <CardDescription>
                    {dayClasses.length === 0
                      ? "No classes scheduled"
                      : `Classes: ${dayClasses.length}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul>
                    {dayClasses.map((cls) => (
                      <li key={cls.id} className="py-2">
                        <div className="font-semibold">{cls.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button size="sm">View Details</Button>
                  <Button size="sm">Book Class</Button>
                </CardFooter>
              </Card>
            </PopoverContent>
          </Popover>
        </div>
      );
    });
  };

  return (
    <DashboardLayout title="Class Calendar">
      <div className="container mx-auto py-10">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Class Calendar</h2>
            <p className="text-gray-500">View and manage your class bookings</p>
          </div>
        </div>

        {error && (
          <Alert variant={!isNetworkConnected ? "default" : "destructive"} className="mb-4">
            {!isNetworkConnected ? (
              <WifiOff className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{!isNetworkConnected ? "You're offline" : "Error"}</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>
                {!isNetworkConnected
                  ? "You're currently offline. Limited functionality is available. Some data is cached for offline use."
                  : error}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Show an offline banner if we're offline but there's no other error */}
        {!isNetworkConnected && !error && (
          <Alert variant="default" className="mb-4 bg-yellow-50 border-yellow-200">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>You're offline</AlertTitle>
            <AlertDescription>
              You're currently working in offline mode. Some features will be limited.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list">
              <Clock className="mr-2 h-4 w-4" />
              Schedule
            </TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="grid gap-4 p-0">
            <div className="border p-4 rounded-lg shadow-md bg-white">
              <div className="flex items-center justify-between pb-6 mb-4 border-b">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  {format(currentDate, "MMMM yyyy")}
                </h3>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
            </div>
          </TabsContent>
          <TabsContent value="list" className="space-y-4 p-0">
            {selectedDate ? (
              <div className="border p-4 rounded-lg shadow-md bg-white">
                <h3 className="text-lg font-semibold mb-4">
                  Classes for {formatDate(selectedDate)}
                </h3>
                {isLoading ? (
                  <LoadingIndicator />
                ) : (
                  <>
                    {getClassesForDate(selectedDate).length > 0 ? (
                      <ul>
                        {getClassesForDate(selectedDate).map((cls) => (
                          <li
                            key={cls.id}
                            className="flex items-center justify-between py-2 border-b last:border-b-0"
                          >
                            <div>
                              <div className="font-semibold">{cls.name}</div>
                              <div className="text-sm text-gray-500">
                                <Clock className="inline-block mr-1 h-4 w-4" />
                                {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                              </div>
                              <div className="text-sm text-gray-500">
                                <MapPin className="inline-block mr-1 h-4 w-4" />
                                {cls.location}
                              </div>
                              <div className="text-sm text-gray-500">
                                <Users className="inline-block mr-1 h-4 w-4" />
                                {cls.enrolled}/{cls.capacity}
                              </div>
                            </div>
                            <div>
                              <Button
                                size="sm"
                                onClick={() => handleOpenBookingDetails(cls)}
                                disabled={!isNetworkConnected}
                              >
                                {cls.booked ? "View Booking" : "Book Class"}
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500">No classes scheduled for this day.</div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Select a date to view scheduled classes.</div>
            )}
          </TabsContent>
        </Tabs>

        {/* Booking Details Dialog */}
        <Dialog open={isBookingDetailsOpen} onOpenChange={setIsBookingDetailsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedClass?.name}</DialogTitle>
              <DialogDescription>
                {selectedClass?.trainer} | {selectedClass?.location}
                <br />
                {selectedClass && formatDate(parseISO(selectedClass.date))}, {selectedClass && formatTime(selectedClass.startTime)} - {selectedClass && formatTime(selectedClass.endTime)}
                <br />
                Capacity: {selectedClass?.enrolled}/{selectedClass?.capacity}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Additional details can be added here */}
            </div>
            <DialogFooter>
              {selectedClass?.booked ? (
                <Button
                  type="button"
                  className="bg-red-500 hover:bg-red-700 text-white"
                  onClick={() => selectedClass && handleCancelBooking(selectedClass.id, formatTime(selectedClass.startTime), selectedClass.name)}
                  disabled={isCancelling || !isNetworkConnected}
                >
                  {isCancelling ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Booking"
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="bg-green-500 hover:bg-green-700 text-white"
                  onClick={() => selectedClass && handleBookClass(selectedClass.id, formatTime(selectedClass.startTime), selectedClass.name)}
                  disabled={isBooking || !isNetworkConnected}
                >
                  {isBooking ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Book Class"
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
