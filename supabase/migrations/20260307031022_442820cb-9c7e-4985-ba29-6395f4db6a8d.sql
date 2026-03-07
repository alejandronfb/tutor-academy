
-- Create helper function using text cast to avoid enum validation in SQL body
CREATE OR REPLACE FUNCTION public.has_course_role(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'content_creator')
  );
END;
$$;

-- Update RLS policies for courses
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Course managers can manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (public.has_course_role(auth.uid()))
  WITH CHECK (public.has_course_role(auth.uid()));

-- Update RLS policies for course_modules
DROP POLICY IF EXISTS "Admins can manage modules" ON public.course_modules;
CREATE POLICY "Course managers can manage modules" ON public.course_modules
  FOR ALL TO authenticated
  USING (public.has_course_role(auth.uid()))
  WITH CHECK (public.has_course_role(auth.uid()));

-- Update RLS policies for lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Course managers can manage lessons" ON public.lessons
  FOR ALL TO authenticated
  USING (public.has_course_role(auth.uid()))
  WITH CHECK (public.has_course_role(auth.uid()));

-- Update RLS policies for quizzes
DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.quizzes;
CREATE POLICY "Course managers can manage quizzes" ON public.quizzes
  FOR ALL TO authenticated
  USING (public.has_course_role(auth.uid()))
  WITH CHECK (public.has_course_role(auth.uid()));

-- Update RLS policies for quiz_questions
DROP POLICY IF EXISTS "Admins can manage questions" ON public.quiz_questions;
CREATE POLICY "Course managers can manage questions" ON public.quiz_questions
  FOR ALL TO authenticated
  USING (public.has_course_role(auth.uid()))
  WITH CHECK (public.has_course_role(auth.uid()));
