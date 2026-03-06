import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, ArrowRight, BookOpen, Video, MessageSquare } from "lucide-react";
import { SPECIALIZATIONS, MODALITIES, PATHWAYS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [specs, setSpecs] = useState<string[]>([]);
  const [modality, setModality] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleSpec = (spec: string) => {
    setSpecs((prev) => prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]);
  };

  const recommendedPaths = PATHWAYS.filter((p) => {
    if (p.id === "core") return true;
    if (p.id === "english" && specs.some((s) => s.includes("English"))) return true;
    if (p.id === "stem" && specs.some((s) => s.includes("STEM"))) return true;
    if (p.id === "writing" && specs.some((s) => s.includes("Writing"))) return true;
    return false;
  });

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const updates: Record<string, unknown> = {};
        if (specs.length > 0) updates.specializations = specs;
        if (modality) updates.teaching_modality = modality;

        if (Object.keys(updates).length > 0) {
          await supabase.from("tutor_profiles").update(updates).eq("id", user.id);
        }

        // Award "Verified LatinHire Tutor" badge
        const { data: badge } = await supabase
          .from("badges")
          .select("id")
          .eq("unlock_type", "registration")
          .maybeSingle();

        if (badge) {
          await supabase.from("user_badges").insert({
            tutor_id: user.id,
            badge_id: badge.id,
          });
        }
      }
      navigate("/dashboard");
    } catch {
      toast({ title: "Error", description: "Could not save preferences.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-card">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl gradient-navy">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Welcome to the Academy!</h1>
          <p className="text-sm text-muted-foreground mt-1">Step {step} of 3 — Let's personalize your experience</p>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "gradient-blue-light" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">Confirm Your Specializations</h2>
            <p className="text-sm text-muted-foreground">Select the areas where you'd like to develop your expertise</p>
            <div className="space-y-3">
              {SPECIALIZATIONS.map((spec) => (
                <div key={spec} className="flex items-center gap-3">
                  <Checkbox id={`onb-${spec}`} checked={specs.includes(spec)} onCheckedChange={() => toggleSpec(spec)} />
                  <label htmlFor={`onb-${spec}`} className="text-sm cursor-pointer">{spec}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">How Do You Teach?</h2>
            <p className="text-sm text-muted-foreground">This helps us recommend the right courses</p>
            <div className="grid grid-cols-3 gap-3">
              {MODALITIES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModality(m)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                    modality === m ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/30"
                  }`}
                >
                  {m === "Video" ? <Video className="h-6 w-6 text-primary" /> : m === "Chat" ? <MessageSquare className="h-6 w-6 text-primary" /> : <BookOpen className="h-6 w-6 text-primary" />}
                  <span className="text-sm font-medium">{m}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">Your Recommended Learning Path</h2>
            <p className="text-sm text-muted-foreground">Based on your selections, we suggest starting here</p>
            <div className="space-y-3">
              {(recommendedPaths.length > 0 ? recommendedPaths : PATHWAYS.slice(0, 2)).map((path) => (
                <div key={path.id} className="flex items-center gap-3 rounded-xl border p-4">
                  <span className="text-2xl">{path.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-foreground">{path.name}</div>
                    <div className="text-xs text-muted-foreground">{path.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
          )}
          <Button
            className="flex-1"
            variant={step === 3 ? "success" : "default"}
            disabled={loading}
            onClick={() => {
              if (step < 3) setStep(step + 1);
              else handleFinish();
            }}
          >
            {step < 3 ? <>Next <ArrowRight className="ml-1 h-4 w-4" /></> : loading ? "Saving…" : "Start Learning 🚀"}
          </Button>
        </div>
      </div>
    </div>
  );
}
