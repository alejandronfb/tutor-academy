import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface QuizViewProps {
  quizId: string;
  courseId?: string;
  moduleTitle?: string;
  isFinal?: boolean;
  passingScore: number;
  onClose: () => void;
  onPassed?: (score: number) => void;
}

export default function QuizView({ quizId, courseId, moduleTitle, isFinal, passingScore, onClose, onPassed }: QuizViewProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery({
    queryKey: ["quiz-questions", quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const saveAttempt = async (score: number, passed: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save quiz attempt
    await supabase.from("quiz_attempts").insert({
      quiz_id: quizId,
      tutor_id: user.id,
      score,
      passed,
    });

    // Award activity points
    const points = passed ? (isFinal ? 100 : 25) : 10;
    await supabase.from("activity_points").insert({
      tutor_id: user.id,
      points,
      reason: passed
        ? (isFinal ? `Passed final exam: ${moduleTitle}` : `Passed module quiz: ${moduleTitle}`)
        : `Attempted quiz: ${moduleTitle}`,
    });

    // If passed final exam → handle course completion
    if (passed && isFinal && courseId) {
      await handleCourseCompletion(user.id, courseId);
    }

    // Check for perfect score badge
    if (score === 100) {
      await awardBadgeIfNew(user.id, "perfect_score");
    }

    // Invalidate dashboard queries
    queryClient.invalidateQueries({ queryKey: ["dashboard-home"] });
    queryClient.invalidateQueries({ queryKey: ["badges"] });
    queryClient.invalidateQueries({ queryKey: ["certifications"] });
    queryClient.invalidateQueries({ queryKey: ["passed-quizzes"] });
  };

  const handleCourseCompletion = async (userId: string, cId: string) => {
    // Mark course enrollment as completed
    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("tutor_id", userId)
      .eq("course_id", cId)
      .maybeSingle();

    if (enrollment) {
      await supabase
        .from("course_enrollments")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", enrollment.id);
    } else {
      await supabase.from("course_enrollments").insert({
        tutor_id: userId,
        course_id: cId,
        completed_at: new Date().toISOString(),
      });
    }

    // Get course slug for badge mapping
    const { data: courseData } = await supabase
      .from("courses")
      .select("slug, certificate_title, title")
      .eq("id", cId)
      .single();

    if (!courseData) return;

    // Award course-specific badge
    await awardBadgeIfNew(userId, "course_completion", courseData.slug);

    // Check courses_count badges (Bookworm=3, Overachiever=7)
    const { count } = await supabase
      .from("course_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", userId)
      .not("completed_at", "is", null);

    if (count && count >= 3) await awardBadgeIfNew(userId, "courses_count", undefined, 3);
    if (count && count >= 7) await awardBadgeIfNew(userId, "courses_count", undefined, 7);

    // Issue certification
    if (courseData.certificate_title) {
      const { data: existingCert } = await supabase
        .from("certifications")
        .select("id")
        .eq("tutor_id", userId)
        .eq("course_id", cId)
        .maybeSingle();

      if (!existingCert) {
        await supabase.from("certifications").insert({
          tutor_id: userId,
          course_id: cId,
          title: courseData.certificate_title,
        });
      }
    }

    toast({
      title: "🎓 Course Completed!",
      description: `You've earned your ${courseData.certificate_title || courseData.title} certification!`,
    });
  };

  const awardBadgeIfNew = async (userId: string, unlockType: string, courseSlug?: string, count?: number) => {
    // Find matching badge
    const { data: badges } = await supabase.from("badges").select("*");
    if (!badges) return;

    let badge;
    if (unlockType === "course_completion" && courseSlug) {
      badge = badges.find((b) => b.unlock_type === "course_completion" && (b.unlock_criteria as any)?.course_slug === courseSlug);
    } else if (unlockType === "courses_count" && count) {
      badge = badges.find((b) => b.unlock_type === "courses_count" && (b.unlock_criteria as any)?.count === count);
    } else if (unlockType === "perfect_score") {
      badge = badges.find((b) => b.unlock_type === "perfect_score");
    }

    if (!badge) return;

    // Check if already awarded
    const { data: existing } = await supabase
      .from("user_badges")
      .select("id")
      .eq("tutor_id", userId)
      .eq("badge_id", badge.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("user_badges").insert({
        tutor_id: userId,
        badge_id: badge.id,
      });

      // Award bonus points for badge
      await supabase.from("activity_points").insert({
        tutor_id: userId,
        points: 50,
        reason: `Badge unlocked: ${badge.name}`,
      });

      toast({
        title: `🏆 Badge Unlocked: ${badge.name}!`,
        description: badge.description || "Keep up the great work!",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No questions available for this quiz.</p>
        <Button variant="outline" className="mt-4" onClick={onClose}>Go Back</Button>
      </div>
    );
  }

  const question = questions[currentQ];
  const options = question.options as string[];
  const totalQuestions = questions.length;

  const handleSelect = (optionIndex: number) => {
    if (showFeedback) return;
    setSelectedOption(optionIndex);
  };

  const handleConfirm = () => {
    if (selectedOption === null) return;
    setAnswers({ ...answers, [currentQ]: selectedOption });
    setShowFeedback(true);
  };

  const handleNext = async () => {
    setShowFeedback(false);
    setSelectedOption(null);
    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // Calculate score and save
      const finalAnswers = { ...answers, [currentQ]: answers[currentQ] };
      const correctCount = questions.reduce((c: number, q: any, i: number) => c + (finalAnswers[i] === q.correct_index ? 1 : 0), 0);
      const scorePercent = Math.round((correctCount / totalQuestions) * 100);
      const passed = scorePercent >= passingScore;

      setSaving(true);
      try {
        await saveAttempt(scorePercent, passed);
        if (passed && onPassed) onPassed(scorePercent);
      } catch (err) {
        console.error("Error saving quiz attempt:", err);
      } finally {
        setSaving(false);
      }
      setSubmitted(true);
    }
  };

  if (submitted) {
    const correctCount = questions.reduce((count: number, q: any, i: number) => {
      return count + (answers[i] === q.correct_index ? 1 : 0);
    }, 0);
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercent >= passingScore;

    return (
      <div className="text-center py-8 space-y-6">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${passed ? "bg-emerald-100 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
          {passed ? <Trophy className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {passed ? "🎉 Quiz Passed!" : "Quiz Not Passed"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {isFinal ? "Final Exam" : `Module Quiz: ${moduleTitle}`}
          </p>
        </div>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{scorePercent}%</p>
            <p className="text-xs text-muted-foreground">Your Score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-muted-foreground">{passingScore}%</p>
            <p className="text-xs text-muted-foreground">Passing Score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{correctCount}/{totalQuestions}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
        </div>
        {saving && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving results...
          </div>
        )}
        <div className="flex gap-3 justify-center pt-4">
          {!passed && (
            <Button variant="outline" onClick={() => {
              setCurrentQ(0);
              setAnswers({});
              setSubmitted(false);
              setSelectedOption(null);
              setShowFeedback(false);
            }}>
              <RotateCcw className="mr-1 h-4 w-4" /> Retry Quiz
            </Button>
          )}
          <Button onClick={onClose}>
            {passed ? "Continue Course" : "Back to Lessons"}
          </Button>
        </div>
      </div>
    );
  }

  const isCorrect = showFeedback && selectedOption === question.correct_index;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {isFinal ? "Final Exam" : `Module Quiz: ${moduleTitle}`}
        </span>
        <span className="text-xs text-muted-foreground">
          Question {currentQ + 1} of {totalQuestions}
        </span>
      </div>
      <Progress value={((currentQ + 1) / totalQuestions) * 100} className="h-2" />

      <h3 className="text-lg font-semibold text-foreground leading-snug">{question.question}</h3>

      <div className="space-y-3">
        {options.map((option: string, oi: number) => {
          let borderClass = "border-border hover:border-primary/50 hover:bg-primary/5";
          if (showFeedback) {
            if (oi === question.correct_index) borderClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
            else if (oi === selectedOption) borderClass = "border-destructive bg-destructive/5";
            else borderClass = "border-border opacity-50";
          } else if (selectedOption === oi) {
            borderClass = "border-primary bg-primary/5 ring-2 ring-primary/20";
          }

          return (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              disabled={showFeedback}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm ${borderClass}`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold
                  ${showFeedback && oi === question.correct_index ? "border-emerald-500 bg-emerald-500 text-white" : ""}
                  ${showFeedback && oi === selectedOption && oi !== question.correct_index ? "border-destructive bg-destructive text-white" : ""}
                  ${!showFeedback && selectedOption === oi ? "border-primary bg-primary text-primary-foreground" : ""}
                  ${!showFeedback && selectedOption !== oi ? "border-muted-foreground/30" : ""}
                `}>
                  {showFeedback && oi === question.correct_index ? <CheckCircle className="h-4 w-4" /> :
                   showFeedback && oi === selectedOption ? <XCircle className="h-4 w-4" /> :
                   String.fromCharCode(65 + oi)}
                </span>
                <span className="text-foreground">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {!showFeedback ? (
          <Button onClick={handleConfirm} disabled={selectedOption === null}>
            Confirm Answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentQ < totalQuestions - 1 ? (
              <>Next Question <ArrowRight className="ml-1 h-4 w-4" /></>
            ) : "See Results"}
          </Button>
        )}
      </div>

      {showFeedback && (
        <div className={`p-4 rounded-xl text-sm ${isCorrect ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800" : "bg-destructive/5 border border-destructive/20"}`}>
          <p className={`font-medium ${isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>
            {isCorrect ? "✓ Correct!" : `✗ Incorrect. The correct answer is: ${options[question.correct_index]}`}
          </p>
        </div>
      )}
    </div>
  );
}
