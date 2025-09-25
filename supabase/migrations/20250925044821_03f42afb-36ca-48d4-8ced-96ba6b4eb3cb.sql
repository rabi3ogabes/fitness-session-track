-- Create a function to get user names from auth metadata
CREATE OR REPLACE FUNCTION public.get_user_name(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_name text;
BEGIN
    -- Try to get name from auth.users metadata
    SELECT COALESCE(
        raw_user_meta_data->>'name',
        email
    ) INTO user_name
    FROM auth.users
    WHERE id = user_id;
    
    RETURN COALESCE(user_name, 'Unknown User');
END;
$$;