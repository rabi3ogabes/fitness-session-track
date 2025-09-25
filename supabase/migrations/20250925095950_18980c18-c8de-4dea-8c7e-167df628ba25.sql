-- Delete duplicate admin notification settings, keeping only the latest one
DELETE FROM admin_notification_settings 
WHERE notification_email = 'rabii.gym@gmail.com' 
AND id NOT IN (
  SELECT id FROM admin_notification_settings 
  WHERE notification_email = 'rabii.gym@gmail.com' 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Update the remaining entry to ensure it has the correct settings
UPDATE admin_notification_settings 
SET 
  email_provider = 'resend',
  booking_notifications = true,
  signup_notifications = true,
  session_request_notifications = true,
  updated_at = now()
WHERE notification_email = 'rabii.gym@gmail.com';