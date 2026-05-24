-- Remove duplicate member rows, keeping the newest per email (among non-deleted)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY lower(email) ORDER BY created_at DESC, id DESC) AS rn
  FROM public.members
  WHERE deleted_at IS NULL
)
DELETE FROM public.members
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Prevent future duplicates: unique index on lower(email) for live (non-deleted) rows
CREATE UNIQUE INDEX IF NOT EXISTS members_email_unique_live
  ON public.members (lower(email))
  WHERE deleted_at IS NULL;