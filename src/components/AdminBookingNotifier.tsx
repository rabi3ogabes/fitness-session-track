import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, User as UserIcon, Users } from "lucide-react";
import { format } from "date-fns";

interface BookingNotification {
  id: string;
  customerName: string;
  className: string;
  schedule: string;
  startTime?: string | null;
  endTime?: string | null;
  enrolled: number;
  capacity: number;
  bookedAt: string;
}

const AdminBookingNotifier = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [notification, setNotification] = useState<BookingNotification | null>(null);

  const playNotificationSound = () => {
    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const tones = [880, 1320]; // two-note chime
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.18;
        const end = start + 0.22;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(end + 0.02);
      });
      setTimeout(() => ctx.close().catch(() => {}), 800);
    } catch {
      // ignore — browser may block audio without user interaction
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const channel = supabase
      .channel(`admin-new-booking-notifier-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        async (payload) => {
          const b: any = payload.new;
          // Only notify on member-initiated bookings
          if (b?.booked_by_role && b.booked_by_role !== "member") return;

          const [{ data: cls }, { count }] = await Promise.all([
            supabase
              .from("classes")
              .select("name, schedule, start_time, end_time, capacity")
              .eq("id", b.class_id)
              .maybeSingle(),
            supabase
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("class_id", b.class_id)
              .eq("status", "confirmed"),
          ]);

          if (!cls) return;

          let customerName: string = b.user_name || b.booked_by_name || "Member";
          if (!b.user_name && !b.booked_by_name && b.user_id) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("name, email")
              .eq("id", b.user_id)
              .maybeSingle();
            customerName = prof?.name || prof?.email || customerName;
          }

          setNotification({
            id: b.id,
            customerName,
            className: cls.name,
            schedule: cls.schedule,
            startTime: cls.start_time,
            endTime: cls.end_time,
            enrolled: count ?? 0,
            capacity: cls.capacity ?? 0,
            bookedAt: b.booking_date || new Date().toISOString(),
          });
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, isAdmin]);

  const close = () => setNotification(null);

  if (!notification) return null;

  let dateLabel = notification.schedule;
  try {
    dateLabel = format(new Date(notification.schedule), "EEEE, MMM d, yyyy");
  } catch {}

  return (
    <Dialog open={!!notification} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            New Class Booking
          </DialogTitle>
          <DialogDescription>
            A member just booked a class.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span><strong>{notification.customerName}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{notification.className} — {dateLabel}</span>
          </div>
          {(notification.startTime || notification.endTime) && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{notification.startTime} - {notification.endTime}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {notification.enrolled}/{notification.capacity} booked
              {notification.capacity > 0 &&
                ` (${Math.max(notification.capacity - notification.enrolled, 0)} spots left)`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground border-t pt-2">
            Booked at {format(new Date(notification.bookedAt), "MMM d, yyyy h:mm a")}
          </p>
        </div>

        <DialogFooter>
          <Button onClick={close}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBookingNotifier;
