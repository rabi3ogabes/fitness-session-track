-- Add separate n8n webhook URL columns for different notification types
ALTER TABLE admin_notification_settings
ADD COLUMN IF NOT EXISTS n8n_signup_webhook_url text,
ADD COLUMN IF NOT EXISTS n8n_booking_webhook_url text,
ADD COLUMN IF NOT EXISTS n8n_cancellation_webhook_url text,
ADD COLUMN IF NOT EXISTS n8n_session_request_webhook_url text;

-- Add comment for clarity
COMMENT ON COLUMN admin_notification_settings.n8n_signup_webhook_url IS 'N8N webhook URL for new member signup notifications';
COMMENT ON COLUMN admin_notification_settings.n8n_booking_webhook_url IS 'N8N webhook URL for class booking notifications';
COMMENT ON COLUMN admin_notification_settings.n8n_cancellation_webhook_url IS 'N8N webhook URL for booking cancellation notifications';
COMMENT ON COLUMN admin_notification_settings.n8n_session_request_webhook_url IS 'N8N webhook URL for session request notifications';