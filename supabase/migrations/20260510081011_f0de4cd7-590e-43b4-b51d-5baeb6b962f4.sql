ALTER TABLE public.members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS idx_members_deleted_at ON public.members(deleted_at);