-- Update admin_notification_settings table to include SMTP configuration
ALTER TABLE public.admin_notification_settings 
ADD COLUMN smtp_host TEXT,
ADD COLUMN smtp_port INTEGER DEFAULT 587,
ADD COLUMN smtp_username TEXT,
ADD COLUMN smtp_password TEXT,
ADD COLUMN smtp_use_tls BOOLEAN DEFAULT true,
ADD COLUMN email_provider TEXT DEFAULT 'smtp' CHECK (email_provider IN ('smtp', 'resend'));

-- Update existing records to use SMTP by default
UPDATE public.admin_notification_settings SET email_provider = 'smtp' WHERE email_provider IS NULL;