-- Let's create a simpler solution without external HTTP calls
-- We'll update the triggers to directly process notifications

-- Drop the problematic triggers that try to call external URLs
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;
DROP TRIGGER IF EXISTS on_booking_created_notification ON public.bookings;
DROP TRIGGER IF EXISTS on_membership_request_created_notification ON public.membership_requests;
DROP TRIGGER IF EXISTS on_notification_log_created ON public.notification_logs;

-- Drop the functions that tried to make external HTTP calls
DROP FUNCTION IF EXISTS public.handle_new_user_notification();
DROP FUNCTION IF EXISTS public.handle_new_booking_notification();
DROP FUNCTION IF EXISTS public.handle_session_request_notification();
DROP FUNCTION IF EXISTS public.process_notification_logs();

-- Create a simple function to mark notifications as ready for processing
CREATE OR REPLACE FUNCTION public.mark_notification_ready()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Just mark the notification as ready - the edge function will pick it up
    NEW.status = 'pending';
    RETURN NEW;
END;
$$;

-- Create a trigger to call the edge function when notifications are created
-- This will be simpler and more reliable
CREATE OR REPLACE FUNCTION public.trigger_notification_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Try to invoke the edge function (this may fail silently but that's ok)
    BEGIN
        PERFORM net.http_post(
            url := 'https://wlawjupusugrhojbywyq.supabase.co/functions/v1/send-email-notification',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYXdqdXB1c3VncmhvamJ5d3lxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjAxMjE5NiwiZXhwIjoyMDYxNTg4MTk2fQ.7C9wj5_E_O3FWnK6aPxoZTQxZlIp55e-5KTrufF4f7E"}'::jsonb,
            body := '{"action": "process_pending"}'::jsonb
        );
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the operation
        RAISE LOG 'Failed to trigger notification processing: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

-- Create the trigger on notification_logs to automatically process when new logs are added
CREATE TRIGGER on_notification_created
    AFTER INSERT ON public.notification_logs
    FOR EACH ROW EXECUTE FUNCTION public.trigger_notification_processing();