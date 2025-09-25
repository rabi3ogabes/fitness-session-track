-- Update send_admin_notification to use the correct edge function
CREATE OR REPLACE FUNCTION public.send_admin_notification(notification_type text, user_email text, user_name text, details text DEFAULT NULL::text)
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
    admin_settings RECORD;
BEGIN
    -- Get admin notification settings
    SELECT * INTO admin_settings FROM admin_notification_settings LIMIT 1;
    
    -- Check if notifications are enabled for this type
    IF admin_settings IS NULL OR 
       (notification_type = 'signup' AND NOT admin_settings.signup_notifications) OR
       (notification_type = 'booking' AND NOT admin_settings.booking_notifications) OR
       (notification_type = 'session_request' AND NOT admin_settings.session_request_notifications) THEN
        RAISE LOG 'Notifications disabled for type: %', notification_type;
        RETURN;
    END IF;

    -- Build the edge function URL - using the correct function name
    function_url := supabase_url || '/functions/v1/send-email-notification';
    
    -- Prepare the payload for the email notification function
    payload := jsonb_build_object(
        'type', notification_type,
        'notificationEmail', admin_settings.notification_email,
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
    
    -- Log the request
    RAISE LOG 'Admin notification sent for % to % - Request ID: %', notification_type, admin_settings.notification_email, request_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        RAISE LOG 'Failed to send admin notification: %', SQLERRM;
END;
$$;