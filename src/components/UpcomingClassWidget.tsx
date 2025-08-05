import { useState, useEffect } from 'react';
import { Clock, Users, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface UpcomingClass {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  trainer: string;
  capacity: number;
  enrolled: number;
}

interface Booking {
  id: string;
  user_name: string;
  status: string;
  booking_date: string;
}

const UpcomingClassWidget = () => {
  const [upcomingClass, setUpcomingClass] = useState<UpcomingClass | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpcomingClass = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1);

      if (classes && classes.length > 0) {
        setUpcomingClass(classes[0]);
        
        // Fetch bookings for this class
        const { data: classBookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('class_id', classes[0].id);

        if (classBookings) {
          const confirmed = classBookings.filter(b => b.status === 'confirmed');
          const cancelled = classBookings.filter(b => b.status === 'cancelled');
          
          setBookings(confirmed);
          setCancelledBookings(cancelled);
        }
      }
    } catch (error) {
      console.error('Error fetching upcoming class:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingClass();

    // Set up real-time subscription for bookings
    const channel = supabase
      .channel('upcoming-class-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          fetchUpcomingClass();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Next Upcoming Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!upcomingClass) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Next Upcoming Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No upcoming classes scheduled
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Next Upcoming Class
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/5 p-4 rounded-lg">
          <h3 className="font-semibold text-lg">{upcomingClass.name}</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(upcomingClass.start_time).toLocaleDateString()} • {upcomingClass.start_time} - {upcomingClass.end_time}
          </p>
          <p className="text-sm text-muted-foreground">Trainer: {upcomingClass.trainer}</p>
          <div className="flex items-center gap-2 mt-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">
              {upcomingClass.enrolled}/{upcomingClass.capacity} enrolled
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Booked Members */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Booked ({bookings.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm">{booking.user_name}</span>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      Confirmed
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No bookings yet</p>
              )}
            </div>
          </div>

          {/* Cancelled Bookings */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <UserMinus className="h-4 w-4 text-red-600" />
              Cancelled ({cancelledBookings.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {cancelledBookings.length > 0 ? (
                cancelledBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm">{booking.user_name}</span>
                    <Badge variant="outline" className="text-red-700 border-red-300">
                      Cancelled
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No cancellations</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingClassWidget;