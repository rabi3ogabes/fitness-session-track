-- Remove duplicate session update triggers to prevent multiple decrements
DROP TRIGGER IF EXISTS booking_session_trigger ON bookings;
DROP TRIGGER IF EXISTS trigger_update_member_sessions_insert ON bookings;
DROP TRIGGER IF EXISTS trigger_update_member_sessions_update ON bookings;
DROP TRIGGER IF EXISTS trigger_update_member_sessions_delete ON bookings;

-- Keep only the main trigger that handles all operations
-- The update_member_sessions_trigger is already properly configured to handle INSERT, UPDATE, and DELETE