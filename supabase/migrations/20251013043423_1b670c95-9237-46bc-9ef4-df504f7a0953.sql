-- First, let's keep only the most recent row with the n8n webhook
-- Delete all but the most recent row
DELETE FROM admin_notification_settings
WHERE id NOT IN (
  SELECT id 
  FROM admin_notification_settings 
  ORDER BY updated_at DESC 
  LIMIT 1
);

-- Add a unique constraint to prevent multiple rows in the future
-- Since this table should only have one row for global settings
ALTER TABLE admin_notification_settings 
ADD CONSTRAINT admin_notification_settings_singleton 
CHECK ((id IS NOT NULL));