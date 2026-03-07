import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Award, CheckCircle, ClipboardList, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import QuizView from "@/components/QuizView";
import RichTextRenderer from "@/components/RichTextRenderer";

export default function CourseDetail() {
  const { courseId } = useParams();
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [showQuiz, setShowQuiz] = useState<{ quizId: string; moduleTitle?: string; isFinal: boolean; passingScore: number } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data: courseData, error: courseErr } = await supabase
        .from("courses").select("*").eq("slug", courseId!).single();
      if (courseErr) throw courseErr;

      const { data: modules, error: modErr } = await supabase
        .from("course_modules").select("*").eq("course_id", courseData.id).order("sort_order");
      if (modErr) throw modErr;

      const moduleIds = modules.map((m) => m.id);
      const { data: lessons, error: lesErr } = await supabase
        .from("lessons").select("*").in("module_id", moduleIds).order("sort_order");
      if (lesErr) throw lesErr;

      // Fetch quizzes for this course
      const { data: quizzes, error: quizErr } = await supabase
        .from("quizzes").select("*").eq("course_id", courseData.id);
      if (quizErr) throw quizErr;

      const modulesWithLessons = modules.map((mod) => ({
        ...mod,
        lessons: lessons.filter((l) => l.module_id === mod.id),
        quiz: quizzes.find((q) => q.module_id === mod.id),
      }));

      const finalQuiz = quizzes.find((q) => q.is_final);

      return { ...courseData, modules: modulesWithLessons, finalQuiz };
    },
    enabled: !!courseId,
  });

  // Fetch user's lesson completions for this course
  const { data: completedLessonIds = [] } = useQuery({
    queryKey: ["lesson-completions", course?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !course) return [];
      const allLessonIds = course.modules.flatMap((m: any) => m.lessons.map((l: any) => l.id));
      if (allLessonIds.length === 0) return [];
      const { data } = await supabase
        .from("lesson_completions")
        .select("lesson_id")
        .eq("tutor_id", user.id)
        .in("lesson_id", allLessonIds);
      return (data || []).map((d) => d.lesson_id);
    },
    enabled: !!course,
  });

  // Fetch user's passed quiz attempts for this course
  const { data: passedQuizIds = [] } = useQuery({
    queryKey: ["passed-quizzes", course?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !course) return [];
      const allQuizIds = [
        ...course.modules.filter((m: any) => m.quiz).map((m: any) => m.quiz.id),
        ...(course.finalQuiz ? [course.finalQuiz.id] : []),
      ];
      if (allQuizIds.length === 0) return [];
      const { data } = await supabase
        .from("quiz_attempts")
        .select("quiz_id")
        .eq("tutor_id", user.id)
        .eq("passed", true)
        .in("quiz_id", allQuizIds);
      return [...new Set((data || []).map((d) => d.quiz_id))];
    },
    enabled: !!course,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if already completed
      const { data: existing } = await supabase
        .from("lesson_completions")
        .select("id")
        .eq("tutor_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();
      if (existing) return { alreadyCompleted: true };

      // Insert completion
      await supabase.from("lesson_completions").insert({
        tutor_id: user.id,
        lesson_id: lessonId,
      });

      // Award 10 activity points
      await supabase.from("activity_points").insert({
        tutor_id: user.id,
        points: 10,
        reason: `Completed lesson: ${currentLesson?.title || "Lesson"}`,
      });

      // Update streak
      const today = new Date().toISOString().split("T")[0];
      const { data: profile } = await supabase
        .from("tutor_profiles")
        .select("last_activity_date, learning_streak")
        .eq("id", user.id)
        .single();

      if (profile) {
        const lastDate = profile.last_activity_date;
        const streak = profile.learning_streak || 0;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        let newStreak = 1;
        if (lastDate === today) {
          newStreak = streak; // already active today
        } else if (lastDate === yesterday) {
          newStreak = streak + 1;
        }

        await supabase
          .from("tutor_profiles")
          .update({ last_activity_date: today, learning_streak: newStreak })
          .eq("id", user.id);

        // Check 7-day streak badge
        if (newStreak >= 7) {
          const { data: badges } = await supabase.from("badges").select("*");
          const weekBadge = badges?.find((b) => b.unlock_type === "streak" && (b.unlock_criteria as any)?.days === 7);
          if (weekBadge) {
            const { data: existing } = await supabase
              .from("user_badges")
              .select("id")
              .eq("tutor_id", user.id)
              .eq("badge_id", weekBadge.id)
              .maybeSingle();
            if (!existing) {
              await supabase.from("user_badges").insert({ tutor_id: user.id, badge_id: weekBadge.id });
              await supabase.from("activity_points").insert({ tutor_id: user.id, points: 50, reason: `Badge unlocked: ${weekBadge.name}` });
              toast({ title: `🏆 Badge Unlocked: ${weekBadge.name}!`, description: weekBadge.description || "Keep it up!" });
            }
          }
        }
      }

      return { alreadyCompleted: false };
    },
    onSuccess: (result) => {
      if (!result?.alreadyCompleted) {
        toast({ title: "✅ Lesson Complete!", description: "+10 activity points earned" });
      }
      queryClient.invalidateQueries({ queryKey: ["lesson-completions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-home"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="rounded-xl border bg-card p-4 shadow-card space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-foreground">Course not found</h2>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/dashboard/courses">Back to Courses</Link>
        </Button>
      </div>
    );
  }

  const currentModule = course.modules[activeModule];
  const currentLesson = currentModule?.lessons[activeLesson];
  const totalLessons = course.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0);
  let lessonNumber = 0;
  for (let i = 0; i < activeModule; i++) lessonNumber += course.modules[i].lessons.length;
  lessonNumber += activeLesson + 1;

  const openModuleQuiz = (mod: any) => {
    if (mod.quiz) {
      setShowQuiz({
        quizId: mod.quiz.id,
        moduleTitle: mod.title,
        isFinal: false,
        passingScore: mod.quiz.passing_score ?? 70,
      });
    }
  };

  const openFinalExam = () => {
    if (course.finalQuiz) {
      setShowQuiz({
        quizId: course.finalQuiz.id,
        moduleTitle: course.title,
        isFinal: true,
        passingScore: course.finalQuiz.passing_score ?? 80,
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/courses"><ArrowLeft className="mr-1 h-4 w-4" /> All Courses</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="rounded-xl border bg-card p-4 shadow-card h-fit">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{course.icon || "📚"}</span>
            <div>
              <h2 className="font-semibold text-sm text-foreground">{course.title}</h2>
              <p className="text-xs text-muted-foreground">{course.duration_hours}h</p>
            </div>
          </div>
          <div className="space-y-1">
            {course.modules.map((mod: any, mi: number) => (
              <div key={mod.id}>
                <button
                  onClick={() => { setActiveModule(mi); setActiveLesson(0); setShowQuiz(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${mi === activeModule && !showQuiz ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                  Module {mi + 1}: {mod.title}
                </button>
                {mi === activeModule && !showQuiz && (
                  <div className="ml-4 space-y-0.5 mt-1">
                    {mod.lessons.map((lesson: any, li: number) => (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(li)}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 ${li === activeLesson ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {completedLessonIds.includes(lesson.id) && (
                          <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                        )}
                        <span>{lesson.title}</span>
                      </button>
                    ))}
                    {mod.quiz && (
                      <button
                        onClick={() => openModuleQuiz(mod)}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs flex items-center gap-1 ${passedQuizIds.includes(mod.quiz.id) ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"}`}
                      >
                        {passedQuizIds.includes(mod.quiz.id) ? (
                          <><CheckCircle className="h-3 w-3" /> Quiz Passed</>
                        ) : (
                          <><ClipboardList className="h-3 w-3" /> Module Quiz</>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final Exam button */}
          {course.finalQuiz && (() => {
            const finalPassed = passedQuizIds.includes(course.finalQuiz.id);
            return (
              <button
                onClick={openFinalExam}
                className={`w-full mt-3 p-3 rounded-lg border text-left transition-colors ${finalPassed ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" : showQuiz?.isFinal ? "bg-primary/10 border-primary/30" : "border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20"}`}
              >
                <div className="flex items-center gap-2">
                  {finalPassed ? (
                    <><CheckCircle className="h-4 w-4 text-emerald-600" /><span className="text-xs font-medium text-emerald-600">Final Exam Passed</span></>
                  ) : (
                    <><ClipboardList className="h-4 w-4 text-amber-600" /><span className="text-xs font-medium text-amber-600">Final Exam</span></>
                  )}
                </div>
              </button>
            );
          })()}

          {course.certificate_title && (
            <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-accent">Certificate</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{course.certificate_title}</p>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="rounded-xl border bg-card p-6 md:p-8 shadow-card">
          {showQuiz ? (
            <QuizView
              quizId={showQuiz.quizId}
              courseId={course.id}
              moduleTitle={showQuiz.moduleTitle}
              isFinal={showQuiz.isFinal}
              passingScore={showQuiz.passingScore}
              onClose={() => setShowQuiz(null)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground">{completedLessonIds.length}/{totalLessons} lessons completed</span>
                <Progress value={(completedLessonIds.length / totalLessons) * 100} className="w-32 h-2" />
              </div>

              {currentLesson && (
                <div className="prose prose-sm max-w-none">
                  <RichTextRenderer content={currentLesson.content} />
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline" size="sm"
                  disabled={activeModule === 0 && activeLesson === 0}
                  onClick={() => {
                    if (activeLesson > 0) setActiveLesson(activeLesson - 1);
                    else if (activeModule > 0) {
                      setActiveModule(activeModule - 1);
                      setActiveLesson(course.modules[activeModule - 1].lessons.length - 1);
                    }
                  }}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Previous
                </Button>

                {currentLesson && completedLessonIds.includes(currentLesson.id) ? (
                  <Button variant="outline" size="sm" disabled className="text-emerald-600 border-emerald-200">
                    <CheckCircle className="mr-1 h-4 w-4" /> Completed
                  </Button>
                ) : (
                  <Button
                    variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={markCompleteMutation.isPending}
                    onClick={() => currentLesson && markCompleteMutation.mutate(currentLesson.id)}
                  >
                    {markCompleteMutation.isPending ? (
                      <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      <><CheckCircle className="mr-1 h-4 w-4" /> Mark as Complete</>
                    )}
                  </Button>
                )}

                {/* If last lesson in module and module has quiz, show "Take Quiz" instead of Next */}
                {activeLesson === currentModule.lessons.length - 1 && currentModule.quiz ? (
                  <Button size="sm" onClick={() => openModuleQuiz(currentModule)} className="bg-amber-600 hover:bg-amber-700">
                    <ClipboardList className="mr-1 h-4 w-4" /> Take Quiz
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={activeModule === course.modules.length - 1 && activeLesson === currentModule.lessons.length - 1}
                    onClick={() => {
                      if (activeLesson < currentModule.lessons.length - 1) setActiveLesson(activeLesson + 1);
                      else if (activeModule < course.modules.length - 1) {
                        setActiveModule(activeModule + 1);
                        setActiveLesson(0);
                      }
                    }}
                  >
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}