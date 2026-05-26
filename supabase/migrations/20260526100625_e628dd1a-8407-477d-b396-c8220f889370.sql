ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booked_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS booked_by_name text,
  ADD COLUMN IF NOT EXISTS booked_by_role text;

CREATE INDEX IF NOT EXISTS idx_bookings_booked_by_user_id ON public.bookings(booked_by_user_id);