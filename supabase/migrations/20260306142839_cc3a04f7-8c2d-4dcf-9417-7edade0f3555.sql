
-- User roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Tutor profiles
CREATE TABLE public.tutor_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  country text,
  native_language text,
  english_level text,
  years_experience text,
  teaching_modality text,
  specializations text[],
  linkedin_url text,
  tutor_level int DEFAULT 1,
  learning_streak int DEFAULT 0,
  last_activity_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view profiles" ON public.tutor_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.tutor_profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.tutor_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Invitation codes
CREATE TABLE public.invitation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read codes" ON public.invitation_codes FOR SELECT USING (true);
CREATE POLICY "Authenticated can update codes" ON public.invitation_codes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can insert codes" ON public.invitation_codes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Courses
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  pathway text NOT NULL,
  difficulty text DEFAULT 'Beginner',
  duration_hours numeric,
  sort_order int DEFAULT 0,
  certificate_title text,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Course modules
CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order int DEFAULT 0
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view modules" ON public.course_modules FOR SELECT USING (true);
CREATE POLICY "Admins can manage modules" ON public.course_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Lessons
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  sort_order int DEFAULT 0
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Quizzes
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  is_final boolean DEFAULT false,
  passing_score int DEFAULT 70
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Admins can manage quizzes" ON public.quizzes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL,
  sort_order int DEFAULT 0
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON public.quiz_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Course enrollments
CREATE TABLE public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(tutor_id, course_id)
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "Users can insert own enrollments" ON public.course_enrollments FOR INSERT TO authenticated WITH CHECK (tutor_id = auth.uid());
CREATE POLICY "Users can update own enrollments" ON public.course_enrollments FOR UPDATE TO authenticated USING (tutor_id = auth.uid()) WITH CHECK (tutor_id = auth.uid());

-- Lesson completions
CREATE TABLE public.lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(tutor_id, lesson_id)
);

ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completions" ON public.lesson_completions FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "Users can insert own completions" ON public.lesson_completions FOR INSERT TO authenticated WITH CHECK (tutor_id = auth.uid());

-- Quiz attempts
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  score int NOT NULL,
  passed boolean NOT NULL,
  attempted_at timestamptz DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "Users can insert own attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (tutor_id = auth.uid());

-- Certifications
CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  verification_id text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  issued_at timestamptz DEFAULT now()
);

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own certs" ON public.certifications FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "Users can insert own certs" ON public.certifications FOR INSERT TO authenticated WITH CHECK (tutor_id = auth.uid());
CREATE POLICY "Public can verify certs" ON public.certifications FOR SELECT USING (true);

-- Badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  unlock_type text,
  unlock_criteria jsonb
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User badges
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(tutor_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "Users can insert own badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (tutor_id = auth.uid());

-- Proficiency results
CREATE TABLE public.proficiency_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  grammar_score int,
  vocabulary_score int,
  reading_score int,
  total_score int,
  level_awarded text,
  taken_at timestamptz DEFAULT now()
);

ALTER TABLE public.proficiency_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own results" ON public.proficiency_results FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "Users can insert own results" ON public.proficiency_results FOR INSERT TO authenticated WITH CHECK (tutor_id = auth.uid());

-- Opportunities
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client text,
  subject text,
  pay_rate text,
  modality text,
  schedule text,
  hours_per_week text,
  requirements text,
  description text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view open opportunities" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Admins can manage opportunities" ON public.opportunities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Opportunity interest
CREATE TABLE public.opportunity_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(tutor_id, opportunity_id)
);

ALTER TABLE public.opportunity_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own interest" ON public.opportunity_interest FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "Users can insert own interest" ON public.opportunity_interest FOR INSERT TO authenticated WITH CHECK (tutor_id = auth.uid());
CREATE POLICY "Admins can view all interest" ON public.opportunity_interest FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Activity points
CREATE TABLE public.activity_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points int NOT NULL,
  reason text,
  earned_at timestamptz DEFAULT now()
);

ALTER TABLE public.activity_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own points" ON public.activity_points FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "Users can insert own points" ON public.activity_points FOR INSERT TO authenticated WITH CHECK (tutor_id = auth.uid());

-- Tutor hours
CREATE TABLE public.tutor_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hours numeric NOT NULL,
  source text,
  logged_at timestamptz DEFAULT now()
);

ALTER TABLE public.tutor_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own hours" ON public.tutor_hours FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "Users can insert own hours" ON public.tutor_hours FOR INSERT TO authenticated WITH CHECK (tutor_id = auth.uid());

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (tutor_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (tutor_id = auth.uid()) WITH CHECK (tutor_id = auth.uid());
