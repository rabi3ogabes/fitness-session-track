-- Create admin notification settings table
CREATE TABLE public.admin_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_email TEXT NOT NULL,
  from_email TEXT,
  from_name TEXT DEFAULT 'Gym System',
  signup_notifications BOOLEAN DEFAULT true,
  booking_notifications BOOLEAN DEFAULT true,
  session_request_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- Admin access policy
CREATE POLICY "Only admins can manage notification settings" 
ON public.admin_notification_settings 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_notification_settings_updated_at
BEFORE UPDATE ON public.admin_notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_admin_notification_settings_updated_at();