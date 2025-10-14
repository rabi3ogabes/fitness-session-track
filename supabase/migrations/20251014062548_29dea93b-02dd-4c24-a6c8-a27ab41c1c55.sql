-- Add resend_enabled column to admin_notification_settings table
ALTER TABLE public.admin_notification_settings 
ADD COLUMN IF NOT EXISTS resend_enabled BOOLEAN DEFAULT true;