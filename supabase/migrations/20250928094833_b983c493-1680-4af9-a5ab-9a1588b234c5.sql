-- First drop all existing triggers, then the function, then recreate everything
DROP TRIGGER IF EXISTS on_notification_created ON notification_logs;
DROP TRIGGER IF EXISTS on_notification_insert ON notification_logs;
DROP FUNCTION IF EXISTS public.trigger_notification_processing() CASCADE;

-- Create a simpler function that just ensures notifications are marked as pending
-- The frontend notification processor hook will handle the actual processing
CREATE OR REPLACE FUNCTION public.trigger_notification_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Create trigger to ensure notifications are properly marked
CREATE TRIGGER on_notification_insert
    BEFORE INSERT ON notification_logs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_notification_processing();