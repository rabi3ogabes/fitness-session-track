-- Instead of using HTTP calls from database functions, let's use a simpler approach
-- Update the send_admin_notification function to just log and let the application handle HTTP calls

CREATE OR REPLACE FUNCTION public.send_admin_notification(notification_type text, user_email text, user_name text, details text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_settings RECORD;
    log_entry_id uuid;
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

    -- Log the notification request in notification_logs table
    INSERT INTO notification_logs (
        notification_type,
        user_email, 
        user_name,
        recipient_email,
        subject,
        status,
        created_at
    ) VALUES (
        notification_type,
        user_email,
        user_name, 
        admin_settings.notification_email,
        CASE 
            WHEN notification_type = 'signup' THEN 'New Member Signup'
            WHEN notification_type = 'booking' THEN 'New Class Booking'
            WHEN notification_type = 'session_request' THEN 'Session Request'
            ELSE 'Notification'
        END,
        'pending',
        now()
    ) RETURNING id INTO log_entry_id;
    
    -- Log success
    RAISE LOG 'Admin notification logged for % to % - Log ID: %', notification_type, admin_settings.notification_email, log_entry_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        RAISE LOG 'Failed to log admin notification: %', SQLERRM;
END;
$$;