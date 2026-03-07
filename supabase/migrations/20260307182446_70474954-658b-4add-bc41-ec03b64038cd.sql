CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events" ON public.analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Admins can view all events" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
