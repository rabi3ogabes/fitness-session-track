ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS auth_id uuid;

CREATE OR REPLACE FUNCTION public.get_user_name(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(name, email)
  FROM public.profiles
  WHERE id = user_id
  LIMIT 1
$$;