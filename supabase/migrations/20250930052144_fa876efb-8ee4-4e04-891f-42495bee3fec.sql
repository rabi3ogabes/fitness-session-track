-- Add CC email field to admin_notification_settings table
ALTER TABLE public.admin_notification_settings 
ADD COLUMN notification_cc_email TEXT;