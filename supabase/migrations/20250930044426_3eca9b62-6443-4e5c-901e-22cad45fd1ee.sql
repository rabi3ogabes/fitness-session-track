-- Create a comprehensive settings table to store all admin settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- General settings
  cancellation_hours INTEGER NOT NULL DEFAULT 4,
  logo TEXT,
  header_color TEXT DEFAULT '#ffffff',
  footer_color TEXT DEFAULT '#000000',
  
  -- Membership expiry settings
  membership_expiry_basic INTEGER DEFAULT 30,
  membership_expiry_standard INTEGER DEFAULT 60,
  membership_expiry_premium INTEGER DEFAULT 90,
  
  -- UI visibility settings
  show_testimonials BOOLEAN DEFAULT true,
  show_low_session_warning BOOLEAN DEFAULT true,
  show_member_delete_icon BOOLEAN DEFAULT true,
  show_class_delete_icon BOOLEAN DEFAULT true,
  show_booking_delete_icon BOOLEAN DEFAULT false,
  
  -- Main page content settings
  hero_title TEXT DEFAULT 'Streamlined Gym Management System',
  hero_description TEXT DEFAULT 'A complete solution for gym owners and members. Manage memberships, book sessions, track attendance, and more.',
  hero_image TEXT DEFAULT 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  feature1_title TEXT DEFAULT 'User Roles',
  feature1_description TEXT DEFAULT 'Separate dashboards for administrators and members with role-specific functionality.',
  feature2_title TEXT DEFAULT 'Session Booking',
  feature2_description TEXT DEFAULT 'Effortless class booking with membership session tracking and management.',
  feature3_title TEXT DEFAULT 'Membership Management',
  feature3_description TEXT DEFAULT 'Easily manage different membership packages with automated session tracking.',
  features_section TEXT DEFAULT 'Our Features',
  testimonials_section TEXT DEFAULT 'What Our Members Say',
  cta_title TEXT DEFAULT 'Ready to Transform Your Fitness Journey?',
  cta_description TEXT DEFAULT 'Join us today and take control of your fitness goals with our comprehensive gym management system.',
  cta_button TEXT DEFAULT 'Get Started Now',
  company_name TEXT DEFAULT 'FitTrack Pro',
  copyright TEXT DEFAULT '© 2025 All rights reserved',
  footer_login TEXT DEFAULT 'Login',
  footer_about TEXT DEFAULT 'About',
  footer_contact TEXT DEFAULT 'Contact',
  footer_privacy TEXT DEFAULT 'Privacy',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can view admin settings" 
ON public.admin_settings 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can insert admin settings" 
ON public.admin_settings 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update admin settings" 
ON public.admin_settings 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete admin settings" 
ON public.admin_settings 
FOR DELETE 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_admin_notification_settings_updated_at();

-- Insert default settings if table is empty
INSERT INTO public.admin_settings (id) 
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);