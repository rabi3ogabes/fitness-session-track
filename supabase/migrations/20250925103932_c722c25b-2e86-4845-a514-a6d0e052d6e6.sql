-- Fix the handle_new_user function to actually send signup notifications
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Send admin notification for new user signup
    PERFORM send_admin_notification(
        'signup',
        COALESCE(NEW.email, 'unknown@example.com'),
        COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown User'),
        'New member registered'
    );
    
    RETURN NEW;
END;
$$;