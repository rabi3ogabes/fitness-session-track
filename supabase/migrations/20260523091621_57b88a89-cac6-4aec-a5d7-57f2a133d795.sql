
ALTER TABLE public.admin_notification_settings
  ADD COLUMN IF NOT EXISTS notification_provider text NOT NULL DEFAULT 'n8n',
  ADD COLUMN IF NOT EXISTS twilio_channel text NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS twilio_from_number text,
  ADD COLUMN IF NOT EXISTS twilio_admin_number text,
  ADD COLUMN IF NOT EXISTS login_notifications boolean NOT NULL DEFAULT true;

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS signup_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS login_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS booking_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cancellation_enabled boolean NOT NULL DEFAULT true;
