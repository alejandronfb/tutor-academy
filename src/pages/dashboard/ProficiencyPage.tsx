import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlaskConical, Clock } from "lucide-react";

export default function ProficiencyPage() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">English Proficiency Test</h1>
          <p className="text-sm text-muted-foreground mt-1">Assess your English proficiency level and earn a badge</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-navy">
              <FlaskConical className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Self-Assessment Test</h2>
              <p className="text-xs text-muted-foreground">4 sections, ~45 minutes</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { section: "Grammar", questions: 15, status: "Ready" },
              { section: "Vocabulary", questions: 15, status: "Ready" },
              { section: "Reading Comprehension", questions: 10, status: "Ready" },
              { section: "Listening Comprehension", questions: 0, status: "Coming Soon" },
            ].map((section) => (
              <div key={section.section} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <span className="text-sm font-medium text-foreground">{section.section}</span>
                  {section.questions > 0 && <span className="text-xs text-muted-foreground ml-2">{section.questions} questions</span>}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${section.status === "Ready" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {section.status}
                </span>
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
            <Button variant="success" onClick={() => setStarted(true)}>Start Test</Button>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> Retake available after 30 days</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">English Proficiency Test</h1>
      <div className="rounded-xl border bg-card p-6 shadow-card text-center">
        <p className="text-muted-foreground">The full proficiency test will be available once the database is seeded with questions.</p>
        <Button variant="outline" className="mt-4" onClick={() => setStarted(false)}>Back</Button>
      </div>
    </div>
  );
}
