-- Fix search path security warnings for the functions we just created

-- Update the update_member_sessions function with proper search path
CREATE OR REPLACE FUNCTION public.update_member_sessions()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update the sync_profile_sessions function with proper search path
CREATE OR REPLACE FUNCTION public.sync_profile_sessions()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update profiles table when members remaining_sessions changes
    UPDATE profiles 
    SET sessions_remaining = NEW.remaining_sessions
    WHERE email = NEW.email;
    
    RETURN NEW;
END;
$$;