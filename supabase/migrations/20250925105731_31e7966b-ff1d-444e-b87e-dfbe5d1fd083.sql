-- Allow functions to insert into notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow the service role to manage notification logs
CREATE POLICY "Service role can manage notification logs" 
ON notification_logs 
FOR ALL 
USING (true)
WITH CHECK (true);