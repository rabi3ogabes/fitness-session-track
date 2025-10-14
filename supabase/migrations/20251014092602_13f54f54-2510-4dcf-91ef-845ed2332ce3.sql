-- Add cancellation_notifications column to admin_notification_settings table
ALTER TABLE admin_notification_settings 
ADD COLUMN IF NOT EXISTS cancellation_notifications BOOLEAN DEFAULT true;