
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'status') THEN
    ALTER TABLE public.courses ADD COLUMN status text DEFAULT 'draft';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'created_by') THEN
    ALTER TABLE public.courses ADD COLUMN created_by uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'certificate_template') THEN
    ALTER TABLE public.courses ADD COLUMN certificate_template text DEFAULT 'classic';
  END IF;
END $$;
