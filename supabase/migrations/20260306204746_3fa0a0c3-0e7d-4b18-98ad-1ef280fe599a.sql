
-- Allow admins to manage certifications
CREATE POLICY "Admins can manage certifications"
ON public.certifications FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage user_badges
CREATE POLICY "Admins can manage user_badges"
ON public.user_badges FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage notifications
CREATE POLICY "Admins can manage notifications"
ON public.notifications FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage tutor_profiles
CREATE POLICY "Admins can manage tutor_profiles"
ON public.tutor_profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all enrollments
CREATE POLICY "Admins can view all enrollments"
ON public.course_enrollments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all quiz_attempts
CREATE POLICY "Admins can view all quiz_attempts"
ON public.quiz_attempts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all lesson_completions
CREATE POLICY "Admins can view all lesson_completions"
ON public.lesson_completions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete codes
CREATE POLICY "Admins can delete codes"
ON public.invitation_codes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all activity_points
CREATE POLICY "Admins can view all activity_points"
ON public.activity_points FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow public to view user_badges (for public profiles)
CREATE POLICY "Public can view user_badges"
ON public.user_badges FOR SELECT
TO anon, authenticated
USING (true);
