
-- Update existing courses to published status (except the test "New Course")
UPDATE public.courses 
SET status = 'published' 
WHERE slug NOT LIKE 'new-course-%' 
  AND slug NOT LIKE '%-copy-%';

-- Update course metadata for completeness
UPDATE public.courses SET certificate_template = 'classic' WHERE certificate_template IS NULL;

-- Ensure Foundations has proper data
UPDATE public.courses SET 
  difficulty = 'Beginner',
  duration_hours = 8,
  certificate_title = 'LatinHire Certified Tutor',
  icon = '🎓',
  sort_order = 1
WHERE slug = 'foundations';

UPDATE public.courses SET 
  difficulty = 'Intermediate',
  duration_hours = 6,
  certificate_title = 'Teaching English Conversation Certificate',
  icon = '💬',
  sort_order = 3
WHERE slug = 'english-conversation';

UPDATE public.courses SET 
  difficulty = 'Intermediate',
  duration_hours = 6,
  certificate_title = 'Teaching Kids & Teens Certificate',
  icon = '🧒',
  sort_order = 4
WHERE slug = 'kids-teens';

UPDATE public.courses SET 
  difficulty = 'Intermediate',
  duration_hours = 8,
  certificate_title = 'STEM Tutoring Certificate',
  icon = '🔬',
  sort_order = 5
WHERE slug = 'stem';

UPDATE public.courses SET 
  difficulty = 'Intermediate',
  duration_hours = 6,
  certificate_title = 'Writing Tutor Certificate',
  icon = '✍️',
  sort_order = 6
WHERE slug = 'writing';

UPDATE public.courses SET 
  difficulty = 'Beginner',
  duration_hours = 5,
  certificate_title = 'Video Tutoring Certificate',
  icon = '📹',
  sort_order = 7
WHERE slug = 'video';

UPDATE public.courses SET 
  difficulty = 'Beginner',
  duration_hours = 5,
  certificate_title = 'Chat Tutoring Certificate',
  icon = '💬',
  sort_order = 8
WHERE slug = 'chat';

-- Seed all 13 badges if they don't exist
INSERT INTO public.badges (name, description, icon, unlock_type, unlock_criteria) VALUES
('Verified LatinHire Tutor', 'Completed registration and onboarding', '✅', 'registration', '{}'),
('Early Adopter', 'Joined the academy in its first year', '🌟', 'registration', '{"year": 2026}'),
('Week Warrior', '7-day learning streak', '🔥', 'streak', '{"days": 7}'),
('Bookworm', 'Completed 3 courses', '📚', 'courses_count', '{"count": 3}'),
('Overachiever', 'Completed all 7 courses', '🏅', 'courses_count', '{"count": 7}'),
('Perfect Score', 'Scored 100% on any quiz', '💯', 'perfect_score', '{}'),
('Foundations Graduate', 'Completed Tutor Foundations', '🎓', 'course_completion', '{"course_slug": "foundations"}'),
('AI Explorer', 'Completed AI Tools course', '🤖', 'course_completion', '{"course_slug": "ai-tools-for-tutoring"}'),
('Conversation Champion', 'Completed English Conversation course', '🗣️', 'course_completion', '{"course_slug": "english-conversation"}'),
('Youth Expert', 'Completed Kids & Teens course', '🧑‍🏫', 'course_completion', '{"course_slug": "kids-teens"}'),
('STEM Specialist', 'Completed STEM course', '🧮', 'course_completion', '{"course_slug": "stem"}'),
('Writing Guru', 'Completed Writing course', '✏️', 'course_completion', '{"course_slug": "writing"}'),
('B2 English', 'Scored B2 on proficiency test', '🅱️', 'proficiency', '{"level": "B2"}'),
('C1 English', 'Scored C1 on proficiency test', '🥈', 'proficiency', '{"level": "C1"}'),
('C2 English', 'Scored C2 on proficiency test', '🥇', 'proficiency', '{"level": "C2"}')
ON CONFLICT DO NOTHING;
