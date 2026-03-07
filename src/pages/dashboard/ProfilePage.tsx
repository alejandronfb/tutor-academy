import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapPin, Download, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TUTOR_LEVELS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { generateCertificatePdf } from "@/lib/generateCertificatePdf";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        (supabase as any).from("tutor_profiles").select("*").eq("id", data.user.id).maybeSingle().then(({ data: p }: any) => setProfile(p));
      }
    });
  }, []);

  const { data: certs } = useQuery({
    queryKey: ["profile-certs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("certifications").select("*").eq("tutor_id", user.id);
      return data || [];
    },
  });

  if (!profile) {
    return <div className="text-center py-20 text-muted-foreground">Loading profile...</div>;
  }

  const levelInfo = TUTOR_LEVELS[(profile.tutor_level || 1) as keyof typeof TUTOR_LEVELS];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your professional profile information</p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-navy text-2xl font-bold text-primary-foreground">
            {profile.full_name?.charAt(0) || "T"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile.full_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{profile.country}</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{levelInfo.name}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Specializations</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.specializations?.map((s: string) => (
                <span key={s} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Teaching Modality</span>
            <p className="text-sm text-foreground mt-2">{profile.teaching_modality}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">English Level</span>
            <p className="text-sm text-foreground mt-2">{profile.english_level}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Experience</span>
            <p className="text-sm text-foreground mt-2">{profile.years_experience} years</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <span className="text-xs text-muted-foreground">Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* Credential Sharing Preferences */}
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-2">Credential Sharing Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Controls for how your name appears on credential verification pages will be available soon.
        </p>
      </div>

      {/* Downloadable Assets */}
      {certs && certs.length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Downloadable Assets</h2>
          <div className="space-y-3">
            {certs.map((cert: any) => (
              <div key={cert.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{cert.title}</p>
                    <p className="text-xs text-muted-foreground">Issued {format(new Date(cert.issued_at), "MMM d, yyyy")}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateCertificatePdf({
                    tutorName: profile.full_name,
                    certTitle: cert.title,
                    issuedAt: format(new Date(cert.issued_at), "MMMM d, yyyy"),
                    verificationId: cert.verification_id,
                    template: cert.certificate_template || "classic",
                  })}
                >
                  <Download className="h-3 w-3 mr-1" /> PDF
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
