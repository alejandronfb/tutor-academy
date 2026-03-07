import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FlaskConical, Clock, CheckCircle, ArrowLeft, ArrowRight, Trophy, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/trackEvent";

interface ProfQuestion {
  id: string;
  section: string;
  difficulty: string;
  question: string;
  passage: string | null;
  options: string[];
  correct_index: number;
  sort_order: number;
}

export default function ProficiencyPage() {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ grammar: number; vocabulary: number; reading: number; total: number; level: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["proficiency-page"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { lastResult: null, canRetake: true };
      const { data: results } = await supabase
        .from("proficiency_results")
        .select("*")
        .eq("tutor_id", user.id)
        .order("taken_at", { ascending: false })
        .limit(1);
      const lastResult = results?.[0] || null;
      const canRetake = !lastResult || (new Date().getTime() - new Date(lastResult.taken_at).getTime()) > 30 * 24 * 60 * 60 * 1000;
      return { lastResult, canRetake };
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["proficiency-questions"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("proficiency_questions") as any)
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as ProfQuestion[];
    },
    enabled: started,
  });

  if (isLoading) {
    return <div className="space-y-6 animate-fade-in max-w-2xl"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  const { lastResult, canRetake } = data!;

  const handleStartTest = () => {
    setStarted(true);
    setCurrentQ(0);
    setAnswers({});
    setSelectedOption(null);
    setSubmitted(false);
    setResult(null);
  };

  const handleSelect = (idx: number) => setSelectedOption(idx);

  const handleNext = () => {
    if (selectedOption === null) return;
    const newAnswers = { ...answers, [currentQ]: selectedOption };
    setAnswers(newAnswers);
    setSelectedOption(answers[currentQ + 1] ?? null);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const handlePrev = () => {
    if (selectedOption !== null) {
      setAnswers({ ...answers, [currentQ]: selectedOption });
    }
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      setSelectedOption(answers[currentQ - 1] ?? null);
    }
  };

  const handleSubmit = async () => {
    if (selectedOption === null) return;
    const finalAnswers = { ...answers, [currentQ]: selectedOption };
    setAnswers(finalAnswers);
    setSaving(true);

    try {
      const grammarQs = questions.filter(q => q.section === "grammar");
      const vocabQs = questions.filter(q => q.section === "vocabulary");
      const readingQs = questions.filter(q => q.section === "reading");

      const calcScore = (qs: ProfQuestion[]) => {
        if (qs.length === 0) return 0;
        const correct = qs.reduce((c, q) => {
          const idx = questions.indexOf(q);
          return c + (finalAnswers[idx] === q.correct_index ? 1 : 0);
        }, 0);
        return Math.round((correct / qs.length) * 100);
      };

      const grammarScore = calcScore(grammarQs);
      const vocabScore = calcScore(vocabQs);
      const readingScore = calcScore(readingQs);
      const totalScore = Math.round(grammarScore * 0.375 + vocabScore * 0.375 + readingScore * 0.25);

      let level = "Below B2";
      if (totalScore >= 90) level = "C2";
      else if (totalScore >= 75) level = "C1";
      else if (totalScore >= 60) level = "B2";

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("proficiency_results").insert({
        tutor_id: user.id,
        grammar_score: grammarScore,
        vocabulary_score: vocabScore,
        reading_score: readingScore,
        total_score: totalScore,
        level_awarded: level,
      });

      await supabase.from("activity_points").insert({
        tutor_id: user.id,
        points: 75,
        reason: "Completed Skills Check",
      });

      trackEvent("skills_check_completed", { total: totalScore, level });

      if (totalScore >= 60) {
        const { data: badges } = await supabase.from("badges").select("*");
        const profBadge = badges?.find((b: any) =>
          b.unlock_type === "proficiency" && (b.unlock_criteria as any)?.level === level
        );
        if (profBadge) {
          const { data: existing } = await supabase
            .from("user_badges")
            .select("id")
            .eq("tutor_id", user.id)
            .eq("badge_id", profBadge.id)
            .maybeSingle();
          if (!existing) {
            await supabase.from("user_badges").insert({ tutor_id: user.id, badge_id: profBadge.id });
            await supabase.from("activity_points").insert({ tutor_id: user.id, points: 50, reason: `Badge earned: ${profBadge.name}` });
            trackEvent("badge_earned", { badge: profBadge.name });
            toast({ title: `🏅 Badge Earned: ${profBadge.name}!`, description: profBadge.description || "" });
          }
        }
      }

      setResult({ grammar: grammarScore, vocabulary: vocabScore, reading: readingScore, total: totalScore, level });
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["proficiency-page"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-home"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Results screen
  if (submitted && result) {
    const levelColor = result.level === "C2" ? "text-amber-500" : result.level === "C1" ? "text-emerald-600" : result.level === "B2" ? "text-primary" : "text-muted-foreground";
    const scores = [
      { label: "Grammar", value: result.grammar },
      { label: "Vocabulary", value: result.vocabulary },
      { label: "Reading", value: result.reading },
    ];
    const strongest = scores.reduce((a, b) => a.value >= b.value ? a : b);
    const weakest = scores.reduce((a, b) => a.value <= b.value ? a : b);

    return (
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div className="py-8 space-y-6 rounded-xl border bg-card p-8 shadow-card">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mt-4">Assessment Complete!</h2>
            <p className="text-muted-foreground mt-1">Here are your private results</p>
            <div className={`text-4xl font-bold mt-4 ${levelColor}`}>Your assessed level: {result.level}</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-foreground">{result.total}%</p>
              <p className="text-xs text-muted-foreground">Overall</p>
            </div>
            {scores.map((s) => (
              <div key={s.label} className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-foreground">{s.value}%</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Strengths & Areas to Develop */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" /> Strongest Area
              </div>
              <p className="text-lg font-bold text-foreground mt-1">{strongest.label} ({strongest.value}%)</p>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-400">
                <TrendingDown className="h-4 w-4" /> Area to Develop
              </div>
              <p className="text-lg font-bold text-foreground mt-1">{weakest.label} ({weakest.value}%)</p>
            </div>
          </div>

          {/* Recommended Next Steps */}
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 text-sm space-y-2">
            <p className="font-medium text-foreground">Recommended Next Steps</p>
            {result.grammar < 75 && <p className="text-muted-foreground">• Strengthen your grammar skills with grammar-focused courses</p>}
            {result.vocabulary < 75 && <p className="text-muted-foreground">• Expand your vocabulary through vocabulary-building courses</p>}
            {result.reading < 75 && <p className="text-muted-foreground">• Improve reading comprehension with reading-intensive courses</p>}
            {result.total >= 75 && <p className="text-muted-foreground">• Great results! Explore advanced specialization courses</p>}
            <Button variant="outline" size="sm" asChild className="mt-2">
              <Link to="/dashboard/courses">Browse Learning Library</Link>
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p><strong>Scoring:</strong> 60-74% = B2 · 75-89% = C1 · 90-100% = C2</p>
            <p className="mt-1">+75 activity points earned</p>
            <p className="mt-1">Retake available in 30 days</p>
            <p className="mt-1">We recommend retaking the Skills Check every 6 months to track your progress.</p>
          </div>

          <div className="text-center">
            <Button onClick={() => { setStarted(false); setSubmitted(false); }}>Back to Overview</Button>
          </div>
        </div>
      </div>
    );
  }

  // Test flow
  if (started && questions.length > 0) {
    const question = questions[currentQ];
    const options = question.options as string[];
    const section = question.section.charAt(0).toUpperCase() + question.section.slice(1);
    const sectionLabel = question.section === "reading" ? "Reading Comprehension" : section;
    const isLastQuestion = currentQ === questions.length - 1;

    return (
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground rounded-full bg-primary/10 px-3 py-1 text-primary">{sectionLabel} — {question.difficulty}</span>
          <span className="text-xs text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
        </div>
        <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2" />

        {question.passage && (
          <div className="rounded-xl border bg-muted/50 p-5 text-sm leading-relaxed text-foreground max-h-64 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Reading Passage</p>
            {question.passage}
          </div>
        )}

        <h3 className="text-lg font-semibold text-foreground leading-snug">{question.question}</h3>

        <div className="space-y-3">
          {options.map((option, oi) => (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm ${
                selectedOption === oi
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                  selectedOption === oi ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                }`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className="text-foreground">{option}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentQ === 0}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          {isLastQuestion ? (
            <Button onClick={handleSubmit} disabled={selectedOption === null || saving}>
              {saving ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Assessment"}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={selectedOption === null}>
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Overview screen
  const lastScores = lastResult ? [
    { label: "Grammar", value: lastResult.grammar_score },
    { label: "Vocabulary", value: lastResult.vocabulary_score },
    { label: "Reading", value: lastResult.reading_score },
  ] : [];
  const lastStrongest = lastScores.length ? lastScores.reduce((a, b) => (a.value ?? 0) >= (b.value ?? 0) ? a : b) : null;
  const lastWeakest = lastScores.length ? lastScores.reduce((a, b) => (a.value ?? 0) <= (b.value ?? 0) ? a : b) : null;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Skills Check</h1>
        <p className="text-sm text-muted-foreground mt-1">A private assessment of your current strengths and areas to develop</p>
      </div>

      {lastResult && (
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-foreground">Latest Result</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-foreground">{lastResult.total_score}%</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-foreground">{lastResult.grammar_score}%</p>
              <p className="text-xs text-muted-foreground">Grammar</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-foreground">{lastResult.vocabulary_score}%</p>
              <p className="text-xs text-muted-foreground">Vocabulary</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-foreground">{lastResult.reading_score}%</p>
              <p className="text-xs text-muted-foreground">Reading</p>
            </div>
          </div>
          {lastStrongest && lastWeakest && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-2 text-center">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Strongest: {lastStrongest.label}</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2 text-center">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Develop: {lastWeakest.label}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Your assessed level: {lastResult.level_awarded}</span>
            <span className="text-xs text-muted-foreground">Taken {format(new Date(lastResult.taken_at), "MMM d, yyyy")}</span>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-navy">
            <FlaskConical className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Private Skills Assessment</h2>
            <p className="text-xs text-muted-foreground">40 questions · 3 sections · ~30 minutes</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { section: "Grammar", questions: 15 },
            { section: "Vocabulary", questions: 15 },
            { section: "Reading Comprehension", questions: 10 },
          ].map((section) => (
            <div key={section.section} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <span className="text-sm font-medium text-foreground">{section.section}</span>
                <span className="text-xs text-muted-foreground ml-2">{section.questions} questions</span>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Ready</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted p-4 mb-6">
          <h3 className="text-sm font-medium text-foreground mb-2">Scoring</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>60-74% → B2 (Upper Intermediate)</p>
            <p>75-89% → C1 (Advanced)</p>
            <p>90-100% → C2 (Proficient)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canRetake ? (
            <Button onClick={handleStartTest}>Begin Assessment</Button>
          ) : (
            <Button disabled>Retake available in 30 days</Button>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> Retake available after 30 days</span>
        </div>
      </div>
    </div>
  );
}
