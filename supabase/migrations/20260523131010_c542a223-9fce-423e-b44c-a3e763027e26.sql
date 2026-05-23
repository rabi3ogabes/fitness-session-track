
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS logo_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  CREATE POLICY "Branding public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'branding');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Branding auth upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'branding');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Branding auth update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'branding');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Branding auth delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'branding');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
