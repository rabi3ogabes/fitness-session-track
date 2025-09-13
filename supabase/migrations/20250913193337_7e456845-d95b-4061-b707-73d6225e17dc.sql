-- Update existing bookings to include member_id and user_name based on user_id
-- First, update bookings with member information by matching user profiles with members
UPDATE bookings 
SET 
  member_id = members.id,
  user_name = members.name
FROM members, profiles
WHERE bookings.user_id = profiles.id 
  AND profiles.email = members.email 
  AND bookings.member_id IS NULL;

-- Alternative update for cases where there's no profile record
-- Match directly by finding members with the same email as the auth user
UPDATE bookings 
SET 
  member_id = members.id,
  user_name = members.name
FROM members
WHERE bookings.user_id::text IN (
  SELECT auth.users.id::text 
  FROM auth.users 
  WHERE auth.users.email = members.email
)
AND bookings.member_id IS NULL;