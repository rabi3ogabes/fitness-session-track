-- Drop the existing table if it has SMTP columns and recreate with new structure
DROP TABLE IF EXISTS public.admin_notification_settings CASCADE;

-- Create admin_notification_settings table for email configuration (Resend-based)
CREATE TABLE public.admin_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_email TEXT NOT NULL,
  from_email TEXT,
  from_name TEXT,
  signup_notifications BOOLEAN NOT NULL DEFAULT true,
  booking_notifications BOOLEAN NOT NULL DEFAULT true,
  session_request_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can view notification settings" 
ON public.admin_notification_settings 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can insert notification settings" 
ON public.admin_notification_settings 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update notification settings" 
ON public.admin_notification_settings 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete notification settings" 
ON public.admin_notification_settings 
FOR DELETE 
USING (is_admin());