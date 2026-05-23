
ALTER TABLE public.admin_notification_settings
  ADD COLUMN IF NOT EXISTS active_provider TEXT NOT NULL DEFAULT 'lovable_email',
  ADD COLUMN IF NOT EXISTS notify_member_welcome BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_member_booking BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_member_cancellation BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_member_session_request BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.admin_notification_settings
  DROP CONSTRAINT IF EXISTS admin_notification_settings_active_provider_check;
ALTER TABLE public.admin_notification_settings
  ADD CONSTRAINT admin_notification_settings_active_provider_check
  CHECK (active_provider IN ('lovable_email', 'n8n'));
