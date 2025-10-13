-- Add n8n webhook URL to admin notification settings
ALTER TABLE admin_notification_settings 
ADD COLUMN n8n_webhook_url text;

COMMENT ON COLUMN admin_notification_settings.n8n_webhook_url IS 'N8N webhook URL for sending notifications';