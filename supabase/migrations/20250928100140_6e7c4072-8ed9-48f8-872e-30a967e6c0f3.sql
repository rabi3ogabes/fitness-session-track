-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests  
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to process pending notifications every minute
SELECT cron.schedule(
  'process-pending-notifications',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://wlawjupusugrhojbywyq.supabase.co/functions/v1/send-email-notification',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYXdqdXB1c3VncmhvamJ5d3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMTIxOTYsImV4cCI6MjA2MTU4ODE5Nn0.-TMflVxBkU4MTTxRWd0jrSiNBCLhxnl8R4EqsrWrSlg"}'::jsonb,
        body:='{"action": "process_pending"}'::jsonb
    ) as request_id;
  $$
);