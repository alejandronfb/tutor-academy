
-- 1. Tutor Activity Monthly table
CREATE TABLE public.tutor_activity_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  month text NOT NULL,
  hours_worked numeric DEFAULT 0,
  source text DEFAULT 'manual',
  synced_at timestamptz DEFAULT now(),
  UNIQUE(tutor_id, month)
);

ALTER TABLE public.tutor_activity_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.tutor_activity_monthly FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "Admins can manage all activity" ON public.tutor_activity_monthly FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Activity status function
CREATE OR REPLACE FUNCTION public.get_activity_status(p_tutor_id uuid)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_month text := to_char(now(), 'YYYY-MM');
  prev_month text := to_char(now() - interval '1 month', 'YYYY-MM');
  recent_hours numeric;
  quarter_hours numeric;
BEGIN
  SELECT COALESCE(SUM(hours_worked), 0) INTO recent_hours
  FROM tutor_activity_monthly
  WHERE tutor_id = p_tutor_id AND month IN (current_month, prev_month);

  IF recent_hours > 0 THEN RETURN 'active'; END IF;

  SELECT COALESCE(SUM(hours_worked), 0) INTO quarter_hours
  FROM tutor_activity_monthly
  WHERE tutor_id = p_tutor_id AND month >= to_char(now() - interval '3 months', 'YYYY-MM');

  IF quarter_hours > 0 THEN RETURN 'recently_active'; END IF;

  RETURN 'inactive';
END;
$$;

-- 3. Scheduled content release
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS release_at timestamptz;
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS release_at timestamptz;

-- 4. Certification lifecycle
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS certification_type text DEFAULT 'permanent';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS certification_validity_months int;
ALTER TABLE public.certifications ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.certifications ADD COLUMN IF NOT EXISTS renewed_at timestamptz;

-- 5. Specialization prerequisites
CREATE TABLE public.specialization_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  prerequisite_course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(course_id, prerequisite_course_id)
);

ALTER TABLE public.specialization_prerequisites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view prerequisites" ON public.specialization_prerequisites FOR SELECT USING (true);
CREATE POLICY "Admins can manage prerequisites" ON public.specialization_prerequisites FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
