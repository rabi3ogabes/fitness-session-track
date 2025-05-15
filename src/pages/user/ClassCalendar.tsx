import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, dateFnsLocalizer, EventProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes, isBefore, isEqual, addDays, differenceInHours, subMinutes as dateFnsSubMinutes } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, XCircle, CalendarDays, Clock, Users, Info, Tag, WifiOff, RefreshCw, AlertTriangle, BadgeInfo } from 'lucide-react';
import { ClassModel } from '@/pages/admin/components/classes/ClassTypes';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cancelClassBooking } from '@/integrations/supabase/client';

interface Booking {
  id: string; 
  class_id: number;
  user_id: string;
  booking_date: string; 
  class_details?: FullClassInfo; 
}

interface CalendarEvent {
  id: string; 
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  isBooking?: boolean; 
  classDetails?: FullClassInfo; 
  bookingDetails?: Booking; 
}

// Extended ClassModel to include all necessary fields from 'classes' table
interface FullClassInfo extends ClassModel {
  start_time: string;
  end_time: string;
  schedule: string; // date string like "yyyy-MM-dd"
  // id is already in ClassModel (number)
  // name is already in ClassModel (string)
  // trainer is already in ClassModel (string)
  // capacity is already in ClassModel (number)
  // gender is already in ClassModel (string)
  // description is already in ClassModel (string)
  // location is already in ClassModel (string)
  // difficulty is already in ClassModel (string)
  // enrolled is now optional in ClassModel, consistent here
  status?: string;
  trainers?: string[]; // array of trainer names or IDs
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales: {
    'en-US': enUS,
  },
});

const CANCELLATION_WINDOW_HOURS = 4; // Minimum hours before class to allow cancellation

const UserClassCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);
  const [sessionsRemaining, setSessionsRemaining] = useState<number | null>(null);
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  const getCurrentUserId = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error fetching user or no user logged in:', userError);
      setError('You must be logged in to view and book classes.');
      setIsLoading(false);
      return null;
    }
    return user.id;
  }, []);

  const fetchData = useCallback(async () => {
    if (!isOnline) {
      setError("You are offline. Please check your internet connection.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSessionsRemaining(null); // Reset while fetching

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      setIsLoading(false); // Stop loading if no user ID
      return;
    }
    setUserId(currentUserId);

    try {
      // Fetch user profile to get sessions_remaining
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('sessions_remaining')
        .eq('id', currentUserId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: single row not found
        console.error('Error fetching user profile:', profileError);
        toast({ title: "Error", description: "Could not fetch your session details.", variant: "destructive" });
        // We can still proceed to fetch classes, but booking might be affected
      }
      setSessionsRemaining(profileData?.sessions_remaining ?? 0);

      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('status', 'Active');

      if (classesError) throw classesError;

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, class_id, booking_date')
        .eq('user_id', currentUserId);

      if (bookingsError) throw bookingsError;
      
      const userBookingMap = new Map<string, Booking>();
      bookingsData?.forEach(booking => {
          if (booking.class_id && booking.booking_date) {
             const classDateStr = format(new Date(booking.booking_date), "yyyy-MM-dd");
             userBookingMap.set(`${booking.class_id}_${classDateStr}`, booking as Booking);
          }
      });

      const calendarEvents = classesData?.map((cls: FullClassInfo) => {
        const classDate = parse(cls.schedule, 'yyyy-MM-dd', new Date());
        const startTimeParts = cls.start_time.split(':');
        const endTimeParts = cls.end_time.split(':');

        const startDate = new Date(classDate);
        startDate.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0, 0);

        const endDate = new Date(classDate);
        endDate.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0, 0);
        
        const eventKey = `${cls.id}_${cls.schedule}`;
        const existingBooking = userBookingMap.get(eventKey);

        return {
          id: existingBooking ? existingBooking.id : `class_${cls.id}_${cls.schedule}`,
          title: cls.name,
          start: startDate,
          end: endDate,
          allDay: false,
          resource: cls, 
          isBooking: !!existingBooking,
          classDetails: cls,
          bookingDetails: existingBooking,
        };
      }).filter(event => event !== null) as CalendarEvent[];

      setEvents(calendarEvents || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(`Failed to load schedule: ${err.message}. Try refreshing.`);
      toast({
        title: 'Error',
        description: `Failed to load schedule: ${err.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, getCurrentUserId, toast]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: "Status", description: "You are back online." });
      fetchData(); // Refetch data when online
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast({ title: "Status", description: "You are offline. Some features may be limited.", variant: "destructive" });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleBookClass = async (classInfo: FullClassInfo) => {
    if (!userId) {
      toast({ title: 'Error', description: 'User not identified. Please log in.', variant: 'destructive' });
      return;
    }
    if (!isOnline) {
        toast({ title: 'Offline', description: 'Cannot book classes while offline.', variant: 'destructive' });
        return;
    }

    const classStartTime = new Date(classInfo.schedule);
    const [hours, minutes] = classInfo.start_time.split(':');
    classStartTime.setHours(parseInt(hours), parseInt(minutes));

    if (isBefore(classStartTime, new Date())) {
        toast({
            title: 'Class in Past',
            description: 'Cannot book a class that has already started or is in the past.',
            variant: 'destructive',
        });
        return;
    }

    setIsBookingInProgress(true);
    try {
      if (classInfo.enrolled !== undefined && classInfo.capacity !== undefined && classInfo.enrolled >= classInfo.capacity) {
        toast({ title: 'Class Full', description: 'This class is already full.', variant: 'destructive' });
        setIsBookingInProgress(false);
        return;
      }

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          class_id: classInfo.id, 
          user_id: userId,
          booking_date: classInfo.schedule, 
          status: 'confirmed', 
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      if (classInfo.enrolled !== undefined) { // enrolled is optional now
        const { error: updateError } = await supabase
          .from('classes')
          .update({ enrolled: (classInfo.enrolled || 0) + 1 })
          .eq('id', classInfo.id);
        if (updateError) {
            console.warn("Failed to update enrolled count, booking still successful:", updateError);
        }
      }
      
      toast({ title: 'Success', description: `Booked for ${classInfo.name} successfully!`, className: "bg-green-500 text-white" });
      setIsModalOpen(false);
      fetchData(); 
    } catch (err: any) {
      console.error('Error booking class:', err);
      toast({ title: 'Error', description: `Failed to book class: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsBookingInProgress(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => { // Ensure bookingId is string
    if (!userId) {
      toast({ title: 'Error', description: 'User not identified.', variant: 'destructive' });
      return;
    }
     if (!isOnline) {
        toast({ title: 'Offline', description: 'Cannot cancel bookings while offline.', variant: 'destructive' });
        return;
    }

    const eventToCancel = events.find(event => event.bookingDetails?.id === bookingId);
    const classInfo = eventToCancel?.classDetails;


    setIsCancelling(true);
    try {
      await cancelClassBooking(bookingId, userId); // bookingId is now string

       if (classInfo && classInfo.id && classInfo.enrolled !== undefined && classInfo.enrolled > 0) {
        const { error: updateError } = await supabase
          .from('classes')
          .update({ enrolled: classInfo.enrolled - 1 })
          .eq('id', classInfo.id); 

        if (updateError) {
            console.warn("Failed to update enrolled count on cancellation, booking still cancelled:", updateError);
        }
      }

      toast({ title: 'Cancelled', description: 'Your booking has been cancelled.', className: "bg-yellow-500 text-white" });
      setIsModalOpen(false);
      fetchData(); 
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      toast({ title: 'Error', description: `Failed to cancel booking: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsCancelling(false);
    }
  };
  
  const handleRetryFetch = () => {
    setIsRetrying(true);
    fetchData().finally(() => setIsRetrying(false));
  };

  const EventComponent: React.FC<EventProps<CalendarEvent>> = ({ event }) => (
    <div className={`p-1 text-xs rounded-sm h-full flex flex-col justify-center ${event.isBooking ? 'bg-gym-blue text-white' : 'bg-gray-200 text-gray-700'} hover:opacity-80 transition-opacity`}>
      <strong className="truncate block">{event.title}</strong>
      {event.isBooking && <span className="text-xs block">(Booked)</span>}
      <span className="text-xs block truncate">{event.classDetails?.location}</span>
    </div>
  );

  const renderModalContent = () => {
    if (!selectedEvent || !selectedEvent.classDetails) return null;
    const { classDetails, bookingDetails, start, end } = selectedEvent; // Added end
    const eventStartTime = typeof start === 'string' ? parse(start, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", new Date()) : start;

    const isPastClass = isBefore(eventStartTime, dateFnsSubMinutes(new Date(), 5)); // Allow actions up to 5 mins after start
    
    // Booking conditions
    const hasCredits = sessionsRemaining !== null && sessionsRemaining > 0;
    const isFull = (classDetails.enrolled || 0) >= classDetails.capacity;
    const canBook = !isPastClass && !bookingDetails && !isFull && hasCredits && isOnline;

    // Cancellation conditions
    const withinCancellationWindow = differenceInHours(eventStartTime, new Date()) >= CANCELLATION_WINDOW_HOURS;
    const canCancel = !isPastClass && bookingDetails && isOnline && withinCancellationWindow;


    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gym-blue">{classDetails.name}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {format(eventStartTime, 'MMMM d, yyyy')} from {format(start, 'p')} to {format(end, 'p')}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3 text-sm">
          <p className="flex items-center"><Info className="w-4 h-4 mr-2 text-gym-purple" /> <strong>Description:</strong> {classDetails.description || 'No description available.'}</p>
          <p className="flex items-center"><Clock className="w-4 h-4 mr-2 text-gym-purple" /> <strong>Trainer:</strong> {classDetails.trainer}</p>
          <p className="flex items-center"><CalendarDays className="w-4 h-4 mr-2 text-gym-purple" /> <strong>Location:</strong> {classDetails.location || 'N/A'}</p>
          <p className="flex items-center"><Users className="w-4 h-4 mr-2 text-gym-purple" /> <strong>Capacity:</strong> {classDetails.enrolled || 0} / {classDetails.capacity}</p>
          <p className="flex items-center"><Tag className="w-4 h-4 mr-2 text-gym-purple" /> <strong>Difficulty:</strong> <Badge variant="outline">{classDetails.difficulty || 'N/A'}</Badge></p>
          {classDetails.gender !== "All" && <p><strong>Gender:</strong> {classDetails.gender} Only</p>}
          
          {bookingDetails && (
            <Badge className="bg-green-100 text-green-700 py-1 px-2">
              <CheckCircle className="w-4 h-4 mr-1" /> You are booked for this class.
            </Badge>
          )}
          {isPastClass && (
             <Badge variant="destructive" className="py-1 px-2">
                <XCircle className="w-4 h-4 mr-1" /> This class is in the past.
            </Badge>
          )}
           {!isOnline && (
            <Badge variant="destructive" className="py-1 px-2">
                <WifiOff className="w-4 h-4 mr-1" /> You are offline. Actions disabled.
            </Badge>
          )}

          {/* Messages for booking/cancellation status */}
          {!bookingDetails && !isPastClass && sessionsRemaining !== null && sessionsRemaining <= 0 && isOnline && (
            <Badge variant="outline" className="py-1 px-2 bg-yellow-100 text-yellow-700 border-yellow-300">
              <AlertTriangle className="w-4 h-4 mr-1" /> You have no session credits. Please renew your membership.
            </Badge>
          )}
          {!bookingDetails && !isPastClass && isFull && isOnline && (
             <Badge variant="outline" className="py-1 px-2 bg-orange-100 text-orange-700 border-orange-300">
                <Users className="w-4 h-4 mr-1" /> This class is currently full.
            </Badge>
          )}
          {bookingDetails && !isPastClass && !withinCancellationWindow && isOnline && (
            <Badge variant="outline" className="py-1 px-2 bg-blue-100 text-blue-700 border-blue-300">
              <BadgeInfo className="w-4 h-4 mr-1" /> It's too late to cancel this booking (less than {CANCELLATION_WINDOW_HOURS} hours before start).
            </Badge>
          )}
           {sessionsRemaining === null && !bookingDetails && !isPastClass && isOnline && (
             <Badge variant="outline" className="py-1 px-2">
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Checking session credits...
            </Badge>
           )}

        </div>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
          {canBook && (
            <Button
              onClick={() => handleBookClass(classDetails)}
              disabled={isBookingInProgress || !isOnline || sessionsRemaining === null}
              className="bg-gym-green hover:bg-gym-green/90 text-white"
            >
              {isBookingInProgress && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Book Class
            </Button>
          )}
          {canCancel && bookingDetails && ( 
            <Button
              variant="destructive"
              onClick={() => handleCancelBooking(String(bookingDetails.id))} 
              disabled={isCancelling || !isOnline}
            >
              {isCancelling && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Cancel Booking
            </Button>
          )}
        </DialogFooter>
      </>
    );
  };

  const dayPropGetter = (date: Date) => {
    if (isBefore(date, startOfToday()) && getDay(date) !== getDay(startOfToday())) { 
      return {
        className: 'rbc-past-day', 
        style: {
          backgroundColor: '#f0f0f0', 
        },
      };
    }
    return {};
  };

  const eventPropGetter = (event: CalendarEvent) => {
    const style: React.CSSProperties = {
      borderRadius: '4px',
      border: 'none',
      display: 'block',
      padding: '2px 4px',
      fontSize: '0.8em',
      opacity: 1,
      cursor: 'pointer'
    };
    if (event.isBooking) {
      style.backgroundColor = '#2563eb'; 
      style.color = 'white';
    } else {
      style.backgroundColor = '#e5e7eb'; 
      style.color = '#374151'; 
    }
    if (event.start && isBefore(event.start, new Date())) {
      style.opacity = 0.6; 
      style.cursor = 'not-allowed';
    }
    return { style };
  };

  if (isLoading && events.length === 0 && sessionsRemaining === null) { 
    return (
      <DashboardLayout title="My Class Calendar">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gym-blue" />
          <p className="ml-2 text-lg">Loading your schedule...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Class Calendar">
      <h1 className="text-3xl font-bold mb-6 text-gym-blue">My Class Calendar</h1>
      <p className="mb-6 text-gray-600">View available classes and your booked sessions. Click on an event to see details or book/cancel.</p>

      {!isOnline && (
         <Alert variant="destructive" className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You are offline</AlertTitle>
          <AlertDescription>
            Class schedule may not be up-to-date. Booking and cancellation are disabled.
          </AlertDescription>
        </Alert>
      )}

      {error && !isLoading && ( 
         <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Schedule</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            {isOnline && (
              <Button variant="outline" size="sm" onClick={handleRetryFetch} disabled={isRetrying}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isRetrying && "animate-spin")} />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (events.length === 0 || sessionsRemaining === null) && ( 
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gym-blue" />
          <p className="ml-2 text-lg">Loading your schedule and session details...</p>
        </div>
      )}

      {!isLoading && !error && (
          <div className="bg-white p-2 sm:p-4 rounded-lg shadow-lg" style={{ height: '70vh', minHeight: '500px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              selectable={false} 
              views={['month', 'week', 'day']}
              defaultView="month"
              components={{
                event: EventComponent,
              }}
              eventPropGetter={eventPropGetter}
              messages={{
                noEventsInRange: 'There are no classes scheduled in this range.',
              }}
              // dayPropGetter={dayPropGetter} // Kept if needed
            />
          </div>
      )}
      

      {selectedEvent && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            {renderModalContent()}
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export default UserClassCalendar;
