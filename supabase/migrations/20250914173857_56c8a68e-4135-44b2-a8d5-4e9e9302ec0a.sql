-- Create admin notification settings table
CREATE TABLE IF NOT EXISTS public.admin_notification_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_email TEXT NOT NULL,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER NOT NULL DEFAULT 587,
    smtp_username TEXT NOT NULL,
    smtp_password TEXT NOT NULL,
    from_email TEXT NOT NULL,
    from_name TEXT NOT NULL DEFAULT 'Gym System',
    use_ssl BOOLEAN NOT NULL DEFAULT true,
    notify_signup BOOLEAN NOT NULL DEFAULT true,
    notify_booking BOOLEAN NOT NULL DEFAULT true,
    notify_session_request BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Only admins can manage notification settings" 
ON public.admin_notification_settings 
FOR ALL 
USING (is_admin());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_notification_settings_updated_at
    BEFORE UPDATE ON public.admin_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_notification_settings_updated_at();

-- Create notification log table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_type TEXT NOT NULL, -- 'signup', 'booking', 'session_request'
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'failed'
    error_message TEXT,
    user_name TEXT,
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notification logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to logs
CREATE POLICY "Only admins can view notification logs" 
ON public.notification_logs 
FOR SELECT 
USING (is_admin());