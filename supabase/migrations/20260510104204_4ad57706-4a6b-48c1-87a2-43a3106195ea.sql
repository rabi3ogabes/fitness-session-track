ALTER TABLE public.members ALTER COLUMN count_credit SET DEFAULT false;

COMMENT ON COLUMN public.members.count_credit IS 'Whether session credits are counted for this member. Disabled by default (false).';