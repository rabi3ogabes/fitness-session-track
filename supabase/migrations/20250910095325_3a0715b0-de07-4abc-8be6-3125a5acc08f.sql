-- Add member_id column to bookings table to reference members
ALTER TABLE public.bookings ADD COLUMN member_id integer;

-- Add foreign key constraint to link bookings to members
ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_member 
FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Update existing bookings to set member_id where possible (if any exist)
-- Note: This might need manual data migration if there are existing bookings

-- Make member_id not null for future records (after data migration)
-- ALTER TABLE public.bookings ALTER COLUMN member_id SET NOT NULL;