CREATE TABLE public.webhook_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_type TEXT NOT NULL,
  webhook_url TEXT,
  status_code INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  response_body TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_delivery_logs_type_created ON public.webhook_delivery_logs(webhook_type, created_at DESC);

ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook delivery logs"
ON public.webhook_delivery_logs
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can delete webhook delivery logs"
ON public.webhook_delivery_logs
FOR DELETE
USING (is_admin());

CREATE POLICY "Service role can insert webhook delivery logs"
ON public.webhook_delivery_logs
FOR INSERT
WITH CHECK (true);