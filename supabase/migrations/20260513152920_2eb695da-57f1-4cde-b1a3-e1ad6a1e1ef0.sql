
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text,
  user_id uuid,
  user_email text,
  user_name text,
  event_type text NOT NULL,
  path text,
  details jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs (user_id);
CREATE INDEX idx_activity_logs_visitor_id ON public.activity_logs (visitor_id);
CREATE INDEX idx_activity_logs_event_type ON public.activity_logs (event_type);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can delete activity logs"
  ON public.activity_logs FOR DELETE
  USING (is_admin());

CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.activity_logs WHERE created_at < now() - interval '30 days';
$$;
