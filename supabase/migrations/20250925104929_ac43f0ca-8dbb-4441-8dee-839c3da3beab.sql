-- Create trigger on auth.users for new user signup notifications
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

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();