-- Create admin role check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- For now, we'll check if the user exists in auth.users
  -- In a real application, you'd have a proper admin role system
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update bookings policies to allow admin access
DROP POLICY IF EXISTS "Enable read access for all users" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;

-- Create new comprehensive policies for bookings
CREATE POLICY "Admins can view all bookings" 
ON bookings 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Users can view their own bookings" 
ON bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bookings" 
ON bookings 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Update profiles policies for admin access
CREATE POLICY "Admins can create profiles" 
ON profiles 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (is_admin());