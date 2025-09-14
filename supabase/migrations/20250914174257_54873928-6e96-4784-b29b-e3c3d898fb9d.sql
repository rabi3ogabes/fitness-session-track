-- Create database triggers for admin notifications

-- Function to send admin notification via edge function
CREATE OR REPLACE FUNCTION send_admin_notification(
    notification_type TEXT,
    user_email TEXT,
    user_name TEXT,
    details TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    supabase_url TEXT := 'https://wlawjupusugrhojbywyq.supabase.co';
    function_url TEXT;
    payload JSONB;
    request_id BIGINT;
BEGIN
    -- Build the edge function URL
    function_url := supabase_url || '/functions/v1/send-admin-notification';
    
    -- Prepare the payload
    payload := jsonb_build_object(
        'type', notification_type,
        'userEmail', user_email,
        'userName', user_name,
        'details', details
    );
    
    -- Make async HTTP request to the edge function
    SELECT INTO request_id net.http_post(
        url := function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYXdqdXB1c3VncmhvamJ5d3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMTIxOTYsImV4cCI6MjA2MTU4ODE5Nn0.-TMflVxBkU4MTTxRWd0jrSiNBCLhxnl8R4EqsrWrSlg'
        ),
        body := payload
    );
    
    -- Log the request (optional)
    RAISE LOG 'Admin notification sent for % - Request ID: %', notification_type, request_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        RAISE LOG 'Failed to send admin notification: %', SQLERRM;
END;
$$;

-- Trigger function for new user signups (profiles table)
CREATE OR REPLACE FUNCTION notify_admin_new_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Send notification asynchronously
    PERFORM send_admin_notification(
        'signup',
        COALESCE(NEW.email, 'unknown@example.com'),
        COALESCE(NEW.name, 'Unknown User'),
        'New member registered with phone: ' || COALESCE(NEW.phone_number, 'Not provided')
    );
    
    RETURN NEW;
END;
$$;

-- Trigger function for new bookings
CREATE OR REPLACE FUNCTION notify_admin_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    class_name TEXT;
    class_time TEXT;
BEGIN
    -- Only notify for confirmed bookings
    IF NEW.status = 'confirmed' THEN
        -- Get class details
        SELECT name, start_time 
        INTO class_name, class_time
        FROM classes 
        WHERE id = NEW.class_id;
        
        -- Send notification
        PERFORM send_admin_notification(
            'booking',
            COALESCE((SELECT email FROM auth.users WHERE id = NEW.user_id), NEW.user_name || '@example.com'),
            COALESCE(NEW.user_name, 'Unknown User'),
            'Class: ' || COALESCE(class_name, 'Unknown') || ' at ' || COALESCE(class_time, 'Unknown time')
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger function for session requests (membership_requests table)
CREATE OR REPLACE FUNCTION notify_admin_session_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Send notification for new session requests
    PERFORM send_admin_notification(
        'session_request',
        NEW.email,
        NEW.member,
        'Requested ' || NEW.sessions || ' sessions of type: ' || NEW.type
    );
    
    RETURN NEW;
END;
$$;

-- Create triggers

-- Trigger for new user signups
CREATE TRIGGER trigger_notify_admin_new_signup
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_signup();

-- Trigger for new bookings
CREATE TRIGGER trigger_notify_admin_new_booking
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_booking();

-- Trigger for session requests
CREATE TRIGGER trigger_notify_admin_session_request
    AFTER INSERT ON public.membership_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_session_request();