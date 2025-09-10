-- Add gender field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('Male', 'Female'));