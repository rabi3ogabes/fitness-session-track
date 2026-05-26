CREATE OR REPLACE FUNCTION public.get_class_enrolled_counts(_class_ids integer[])
RETURNS TABLE(class_id integer, enrolled bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.class_id, COUNT(*)::bigint AS enrolled
  FROM public.bookings b
  WHERE b.status = 'confirmed'
    AND b.class_id = ANY(_class_ids)
  GROUP BY b.class_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_class_enrolled_counts(integer[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_class_enrolled_count(_class_id integer)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.bookings
  WHERE class_id = _class_id AND status = 'confirmed';
$$;

GRANT EXECUTE ON FUNCTION public.get_class_enrolled_count(integer) TO anon, authenticated;