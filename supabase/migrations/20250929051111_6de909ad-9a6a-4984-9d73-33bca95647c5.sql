-- Fix the session update trigger to prevent double increment/decrement
DROP TRIGGER IF EXISTS update_member_sessions_trigger ON bookings;

-- Create improved trigger function that handles session updates correctly
CREATE OR REPLACE FUNCTION public.update_member_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Handle INSERT operations (new bookings)
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        -- Decrement remaining sessions for confirmed bookings
        UPDATE members 
        SET remaining_sessions = GREATEST(0, remaining_sessions - 1)
        WHERE (name = NEW.user_name OR id::text = NEW.member_id::text)
        AND remaining_sessions > 0;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE operations (status changes)
    IF TG_OP = 'UPDATE' THEN
        -- Booking changed from not-confirmed to confirmed
        IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
            UPDATE members 
            SET remaining_sessions = GREATEST(0, remaining_sessions - 1)
            WHERE (name = NEW.user_name OR id::text = NEW.member_id::text)
            AND remaining_sessions > 0;
            
        -- Booking changed from confirmed to not-confirmed (cancelled)
        ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
            UPDATE members 
            SET remaining_sessions = remaining_sessions + 1
            WHERE (name = NEW.user_name OR id::text = NEW.member_id::text);
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE operations (booking deleted while confirmed)
    IF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
        -- Increment remaining sessions when confirmed booking is deleted
        UPDATE members 
        SET remaining_sessions = remaining_sessions + 1
        WHERE (name = OLD.user_name OR id::text = OLD.member_id::text);
        
        RETURN OLD;
    END IF;
    
    -- Default return
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER update_member_sessions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_member_sessions();