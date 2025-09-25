-- Add cascade deletion for bookings when user is deleted
-- Update the existing user_id foreign key to include ON DELETE CASCADE
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- For membership_requests, we need to link by email and create a function
-- to handle deletion when a user is deleted
CREATE OR REPLACE FUNCTION public.delete_user_related_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email text;
BEGIN
    -- Get the email of the deleted user
    SELECT email INTO user_email FROM auth.users WHERE id = OLD.id;
    
    -- Delete membership requests associated with this user's email
    DELETE FROM public.membership_requests 
    WHERE email = user_email;
    
    -- Log the cleanup
    RAISE LOG 'Cleaned up data for deleted user: % (email: %)', OLD.id, user_email;
    
    RETURN OLD;
END;
$$;

-- Create trigger to cleanup related data when user is deleted
DROP TRIGGER IF EXISTS cleanup_user_data_on_delete ON auth.users;
CREATE TRIGGER cleanup_user_data_on_delete
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_user_related_data();

-- Also update profiles table to cascade delete
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;