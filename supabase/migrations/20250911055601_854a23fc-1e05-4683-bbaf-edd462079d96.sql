-- Fix session balance inconsistencies and create proper triggers

-- First, let's fix the current data inconsistencies
-- Update remaining_sessions based on actual booking count
UPDATE members 
SET remaining_sessions = GREATEST(0, 
    COALESCE(total_sessions, 0) - (
        SELECT COUNT(*) 
        FROM bookings 
        WHERE (bookings.user_name = members.name OR bookings.member_id::text = members.id::text)
        AND bookings.status = 'confirmed'
    )
)
WHERE total_sessions > 0;

-- Fix test user's data
UPDATE members 
SET total_sessions = 20, sessions = 20
WHERE email = 'testasd@gmail.com' AND total_sessions = 0;

-- Create a function to maintain session balance automatically
CREATE OR REPLACE FUNCTION update_member_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- If a booking is being inserted/updated to confirmed status
    IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR 
       (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
        
        -- Decrement remaining sessions
        UPDATE members 
        SET remaining_sessions = GREATEST(0, remaining_sessions - 1)
        WHERE (name = NEW.user_name OR id::text = NEW.member_id::text)
        AND remaining_sessions > 0;
        
    -- If a booking is being updated from confirmed to cancelled
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
        
        -- Increment remaining sessions
        UPDATE members 
        SET remaining_sessions = remaining_sessions + 1
        WHERE (name = NEW.user_name OR id::text = NEW.member_id::text);
        
    -- If a confirmed booking is being deleted
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
        
        -- Increment remaining sessions
        UPDATE members 
        SET remaining_sessions = remaining_sessions + 1
        WHERE (name = OLD.user_name OR id::text = OLD.member_id::text);
        
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update sessions on booking changes
DROP TRIGGER IF EXISTS booking_session_trigger ON bookings;
CREATE TRIGGER booking_session_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_member_sessions();

-- Create a function to sync profiles table sessions with members table
CREATE OR REPLACE FUNCTION sync_profile_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profiles table when members remaining_sessions changes
    UPDATE profiles 
    SET sessions_remaining = NEW.remaining_sessions
    WHERE email = NEW.email;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync profiles when members sessions change
DROP TRIGGER IF EXISTS sync_profile_sessions_trigger ON members;
CREATE TRIGGER sync_profile_sessions_trigger
    AFTER UPDATE OF remaining_sessions ON members
    FOR EACH ROW EXECUTE FUNCTION sync_profile_sessions();