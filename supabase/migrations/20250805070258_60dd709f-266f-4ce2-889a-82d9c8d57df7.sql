-- Enable real-time for membership_requests table
ALTER TABLE public.membership_requests REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.membership_requests;