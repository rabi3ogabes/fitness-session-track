-- Create missing triggers to automatically send email notifications

-- Trigger for new user signups (auth.users table)
CREATE OR REPLACE FUNCTION public.handle_new_user_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Call edge function to process pending notifications
    PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-email-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body := jsonb_build_object('action', 'process_pending')
    );
    
    RETURN NEW;
END;
$$;

-- Trigger for new bookings
CREATE OR REPLACE FUNCTION public.handle_new_booking_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only trigger for confirmed bookings
    IF NEW.status = 'confirmed' THEN
        -- Call edge function to process pending notifications
        PERFORM net.http_post(
            url := current_setting('app.supabase_url') || '/functions/v1/send-email-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.service_role_key')
            ),
            body := jsonb_build_object('action', 'process_pending')
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for new session requests
CREATE OR REPLACE FUNCTION public.handle_session_request_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Call edge function to process pending notifications
    PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-email-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body := jsonb_build_object('action', 'process_pending')
    );
    
    RETURN NEW;
END;
$$;

-- Create the actual triggers
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;
CREATE TRIGGER on_auth_user_created_notification
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notification();

DROP TRIGGER IF EXISTS on_booking_created_notification ON public.bookings;
CREATE TRIGGER on_booking_created_notification
    AFTER INSERT OR UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_booking_notification();

DROP TRIGGER IF EXISTS on_membership_request_created_notification ON public.membership_requests;
CREATE TRIGGER on_membership_request_created_notification
    AFTER INSERT ON public.membership_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_session_request_notification();

-- Also create a trigger to automatically call the edge function when new logs are created
CREATE OR REPLACE FUNCTION public.process_notification_logs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Call edge function to process pending notifications
    PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-email-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body := jsonb_build_object('action', 'process_pending')
    );
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_notification_log_created ON public.notification_logs;
CREATE TRIGGER on_notification_log_created
    AFTER INSERT ON public.notification_logs
    FOR EACH ROW EXECUTE FUNCTION public.process_notification_logs();