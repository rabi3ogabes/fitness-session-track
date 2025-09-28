-- Fix the security warning for the trigger function by setting search_path properly
DROP FUNCTION IF EXISTS public.trigger_notification_processing() CASCADE;

CREATE OR REPLACE FUNCTION public.trigger_notification_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Simply ensure the notification is marked as pending
    -- The frontend useNotificationProcessor hook will handle processing
    NEW.status = 'pending';
    
    -- Log for debugging
    RAISE LOG 'Notification ready for processing: % (ID: %)', NEW.notification_type, NEW.id;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_notification_insert
    BEFORE INSERT ON notification_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_notification_processing();