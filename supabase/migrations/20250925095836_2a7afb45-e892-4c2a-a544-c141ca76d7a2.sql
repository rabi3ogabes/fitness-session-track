-- Update the email provider to resend for the admin notification settings
UPDATE admin_notification_settings 
SET email_provider = 'resend'
WHERE notification_email = 'rabii.gym@gmail.com';