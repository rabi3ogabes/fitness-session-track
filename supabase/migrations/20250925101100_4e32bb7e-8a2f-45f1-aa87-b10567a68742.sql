-- Create trigger to send admin notification when new bookings are created
CREATE OR REPLACE TRIGGER trigger_notify_admin_new_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_booking();

-- Create trigger to update member sessions when bookings are created/updated/deleted  
CREATE OR REPLACE TRIGGER trigger_update_member_sessions_insert
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_member_sessions();

CREATE OR REPLACE TRIGGER trigger_update_member_sessions_update
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_member_sessions();

CREATE OR REPLACE TRIGGER trigger_update_member_sessions_delete
  AFTER DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_member_sessions();