CREATE POLICY "Anyone can view admin settings for public pages"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (true);