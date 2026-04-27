
CREATE TABLE public.session_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id integer NOT NULL,
  member_name text,
  delta integer NOT NULL,
  previous_sessions integer NOT NULL,
  new_sessions integer NOT NULL,
  reason text,
  changed_by_user_id uuid,
  changed_by_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view session history"
ON public.session_history FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert session history"
ON public.session_history FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update session history"
ON public.session_history FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete session history"
ON public.session_history FOR DELETE
USING (is_admin());

CREATE INDEX idx_session_history_member_id ON public.session_history(member_id);
CREATE INDEX idx_session_history_created_at ON public.session_history(created_at DESC);
