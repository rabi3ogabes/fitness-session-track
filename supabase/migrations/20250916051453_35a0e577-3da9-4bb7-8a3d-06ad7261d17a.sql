-- Enable real-time for members table
ALTER TABLE public.members REPLICA IDENTITY FULL;

-- Enable real-time for profiles table  
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;