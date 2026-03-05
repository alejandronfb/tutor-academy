import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GraduationCap, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { LATIN_COUNTRIES, ENGLISH_LEVELS, EXPERIENCE_RANGES, MODALITIES, SPECIALIZATIONS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    invitationCode: "",
    fullName: "",
    email: "",
    password: "",
    country: "",
    nativeLanguage: "",
    englishLevel: "",
    yearsExperience: "",
    teachingModality: "",
    specializations: [] as string[],
    linkedinUrl: "",
  });

  const updateForm = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSpec = (spec: string) => {
    setForm((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) { setStep(step + 1); return; }

    setLoading(true);

    // Validate invitation code
    const { data: codeData, error: codeError } = await supabase
      .from("invitation_codes")
      .select("id, used_by")
      .eq("code", form.invitationCode)
      .maybeSingle();

    if (codeError || !codeData) {
      setLoading(false);
      toast({ title: "Invalid invitation code", description: "Please check your code and try again.", variant: "destructive" });
      setStep(1);
      return;
    }

    if (codeData.used_by) {
      setLoading(false);
      toast({ title: "Code already used", description: "This invitation code has already been used.", variant: "destructive" });
      setStep(1);
      return;
    }

    // Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (authError || !authData.user) {
      setLoading(false);
      toast({ title: "Registration failed", description: authError?.message || "Unknown error", variant: "destructive" });
      return;
    }

    // Create profile
    await supabase.from("tutor_profiles").insert({
      id: authData.user.id,
      full_name: form.fullName,
      country: form.country,
      native_language: form.nativeLanguage,
      english_level: form.englishLevel,
      years_experience: form.yearsExperience,
      teaching_modality: form.teachingModality,
      specializations: form.specializations,
      linkedin_url: form.linkedinUrl || null,
    });

    // Mark invitation code as used
    await supabase.from("invitation_codes").update({
      used_by: authData.user.id,
      used_at: new Date().toISOString(),
    }).eq("id", codeData.id);

    // Award Verified badge
    const { data: verifiedBadge } = await supabase
      .from("badges")
      .select("id")
      .eq("name", "Verified LatinHire Tutor")
      .maybeSingle();

    if (verifiedBadge) {
      await supabase.from("user_badges").insert({
        tutor_id: authData.user.id,
        badge_id: verifiedBadge.id,
      });
    }

    setLoading(false);
    navigate("/onboarding");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-navy">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create Your Account</h1>
            <p className="text-sm text-muted-foreground mt-1">Step {step} of 3</p>
            {/* Progress bar */}
            <div className="mt-4 flex gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "gradient-green" : "bg-muted"}`} />
              ))}
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <Label htmlFor="code">Invitation Code *</Label>
                  <Input id="code" value={form.invitationCode} onChange={(e) => updateForm("invitationCode", e.target.value)} placeholder="Enter your LatinHire invitation code" required />
                  <p className="text-xs text-muted-foreground mt-1">Provided by the LatinHire team</p>
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" value={form.fullName} onChange={(e) => updateForm("fullName", e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="regEmail">Email *</Label>
                  <Input id="regEmail" type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="regPassword">Password *</Label>
                  <div className="relative">
                    <Input id="regPassword" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => updateForm("password", e.target.value)} required minLength={8} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label>Country *</Label>
                  <Select value={form.country} onValueChange={(v) => updateForm("country", v)}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {LATIN_COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Native Language *</Label>
                  <Input id="language" value={form.nativeLanguage} onChange={(e) => updateForm("nativeLanguage", e.target.value)} placeholder="e.g. Spanish, Portuguese" required />
                </div>
                <div>
                  <Label>English Level *</Label>
                  <Select value={form.englishLevel} onValueChange={(v) => updateForm("englishLevel", v)}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      {ENGLISH_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Years of Experience *</Label>
                  <Select value={form.yearsExperience} onValueChange={(v) => updateForm("yearsExperience", v)}>
                    <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_RANGES.map((r) => <SelectItem key={r} value={r}>{r} years</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <Label>Teaching Modality *</Label>
                  <Select value={form.teachingModality} onValueChange={(v) => updateForm("teachingModality", v)}>
                    <SelectTrigger><SelectValue placeholder="Select modality" /></SelectTrigger>
                    <SelectContent>
                      {MODALITIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-3 block">Specializations *</Label>
                  <div className="space-y-3">
                    {SPECIALIZATIONS.map((spec) => (
                      <div key={spec} className="flex items-center gap-3">
                        <Checkbox
                          id={spec}
                          checked={form.specializations.includes(spec)}
                          onCheckedChange={() => toggleSpec(spec)}
                        />
                        <label htmlFor={spec} className="text-sm cursor-pointer">{spec}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn URL (optional)</Label>
                  <Input id="linkedin" value={form.linkedinUrl} onChange={(e) => updateForm("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." />
                  <p className="text-xs text-muted-foreground mt-1">Visible to admins only, never shown publicly</p>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={loading}>
                {step < 3 ? (
                  <>Next <ArrowRight className="ml-1 h-4 w-4" /></>
                ) : loading ? "Creating account…" : (
                  <>Create Account <ArrowRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
