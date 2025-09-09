-- Fix the admin function with proper search path and better admin detection
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if user is authenticated and has admin role in user_metadata
  RETURN auth.uid() IS NOT NULL AND 
         COALESCE((auth.jwt() ->> 'user_metadata')::json ->> 'role', '') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;