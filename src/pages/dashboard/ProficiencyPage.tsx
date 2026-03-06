import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlaskConical, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ProficiencyPage() {
  const [started, setStarted] = useState(false);

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

  if (isLoading) {
    return <div className="space-y-6 animate-fade-in max-w-2xl"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  const { lastResult, canRetake } = data!;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">English Proficiency Test</h1>
        <p className="text-sm text-muted-foreground mt-1">Assess your English proficiency level and earn a badge</p>
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
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Level: {lastResult.level_awarded}</span>
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
            <h2 className="font-semibold text-foreground">Self-Assessment Test</h2>
            <p className="text-xs text-muted-foreground">3 sections, ~30 minutes</p>
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
            <Button onClick={() => setStarted(true)}>Start Test</Button>
          ) : (
            <Button disabled>Retake available in 30 days</Button>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> Retake available after 30 days</span>
        </div>
      </div>

      {started && (
        <div className="rounded-xl border bg-card p-6 shadow-card text-center">
          <p className="text-muted-foreground">The full proficiency test questions are coming soon. Stay tuned!</p>
          <Button variant="outline" className="mt-4" onClick={() => setStarted(false)}>Back</Button>
        </div>
      )}
    </div>
  );
}