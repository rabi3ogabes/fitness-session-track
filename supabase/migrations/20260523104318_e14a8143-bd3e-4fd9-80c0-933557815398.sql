DROP TRIGGER IF EXISTS on_notification_insert ON public.notification_logs;
DROP FUNCTION IF EXISTS public.trigger_notification_processing();
DROP FUNCTION IF EXISTS public.mark_notification_ready();