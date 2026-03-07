import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapPin, Download, Award, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TUTOR_LEVELS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { generateCertificatePdf } from "@/lib/generateCertificatePdf";
import jsPDF from "jspdf";

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

  const { data: activityStatus } = useQuery({
    queryKey: ["profile-activity-status"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "inactive";
      const { data } = await supabase.rpc("get_activity_status", { p_tutor_id: user.id });
      return data || "inactive";
    },
  });

  const { data: transcript } = useQuery({
    queryKey: ["profile-transcript"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { certs: [], badges: [], courses: [], proficiency: [] };

      const [certsRes, badgesRes, coursesRes, profRes] = await Promise.all([
        supabase.from("certifications").select("*, courses(title)").eq("tutor_id", user.id).order("issued_at", { ascending: false }),
        supabase.from("user_badges").select("*, badges(name, icon)").eq("tutor_id", user.id).order("unlocked_at", { ascending: false }),
        supabase.from("course_enrollments").select("*, courses(title)").eq("tutor_id", user.id).not("completed_at", "is", null).order("completed_at", { ascending: false }),
        supabase.from("proficiency_results").select("*").eq("tutor_id", user.id).order("taken_at", { ascending: false }),
      ]);

      return {
        certs: certsRes.data || [],
        badges: badgesRes.data || [],
        courses: coursesRes.data || [],
        proficiency: profRes.data || [],
      };
    },
  });

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

  const statusLabel = activityStatus === "active" ? "Active" : activityStatus === "recently_active" ? "Recently Active" : "Inactive";
  const statusColor = activityStatus === "active" ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400" : activityStatus === "recently_active" ? "text-amber-600 bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400" : "text-muted-foreground bg-muted";

  const downloadTranscript = () => {
    if (!transcript) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(18);
    doc.setTextColor(15, 60, 110);
    doc.text("Professional Development Transcript", w / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("LatinHire Tutor Academy", w / 2, y, { align: "center" });
    y += 12;

    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(profile.full_name, 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, 20, y);
    y += 12;

    // Courses
    if (transcript.courses.length) {
      doc.setFontSize(11);
      doc.setTextColor(15, 60, 110);
      doc.text("Courses Completed", 20, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      transcript.courses.forEach((c: any) => {
        doc.text(`• ${(c.courses as any)?.title || "Course"} — ${format(new Date(c.completed_at), "MMM d, yyyy")}`, 25, y);
        y += 5;
      });
      y += 4;
    }

    // Certifications
    if (transcript.certs.length) {
      doc.setFontSize(11);
      doc.setTextColor(15, 60, 110);
      doc.text("Certifications", 20, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      transcript.certs.forEach((c: any) => {
        const status = c.expires_at ? (new Date(c.expires_at) < new Date() ? "Expired" : "Active") : "Active";
        doc.text(`• ${c.title} — ${format(new Date(c.issued_at), "MMM d, yyyy")} [${status}]`, 25, y);
        y += 5;
      });
      y += 4;
    }

    // Badges
    if (transcript.badges.length) {
      doc.setFontSize(11);
      doc.setTextColor(15, 60, 110);
      doc.text("Badges Earned", 20, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      transcript.badges.forEach((b: any) => {
        doc.text(`• ${(b.badges as any)?.name || "Badge"} — ${format(new Date(b.unlocked_at), "MMM d, yyyy")}`, 25, y);
        y += 5;
      });
      y += 4;
    }

    // Proficiency
    if (transcript.proficiency.length) {
      doc.setFontSize(11);
      doc.setTextColor(15, 60, 110);
      doc.text("Skills Check Results", 20, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      transcript.proficiency.forEach((p: any) => {
        doc.text(`• ${p.level_awarded} (${p.total_score}%) — ${format(new Date(p.taken_at), "MMM d, yyyy")}`, 25, y);
        y += 5;
      });
    }

    doc.save(`${profile.full_name.replace(/\s+/g, "_")}_Transcript.pdf`);
  };

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

        {/* Activity Status */}
        <div className="mb-6 p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Academy Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>{statusLabel}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Based on your recent tutoring activity with LatinHire</p>
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

      {/* Transcript */}
      {transcript && (transcript.courses.length > 0 || transcript.certs.length > 0 || transcript.badges.length > 0) && (
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Professional Development Transcript</h2>
            <Button variant="outline" size="sm" onClick={downloadTranscript}>
              <Download className="h-3 w-3 mr-1" /> Download PDF
            </Button>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {/* Merge and sort chronologically */}
            {[
              ...transcript.courses.map((c: any) => ({ type: "course", title: (c.courses as any)?.title, date: c.completed_at })),
              ...transcript.certs.map((c: any) => ({ type: "cert", title: c.title, date: c.issued_at, expires_at: c.expires_at })),
              ...transcript.badges.map((b: any) => ({ type: "badge", title: (b.badges as any)?.name, icon: (b.badges as any)?.icon, date: b.unlocked_at })),
              ...transcript.proficiency.map((p: any) => ({ type: "proficiency", title: `Skills Check: ${p.level_awarded} (${p.total_score}%)`, date: p.taken_at })),
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                <div className="text-lg">
                  {item.type === "course" ? "📚" : item.type === "cert" ? "📜" : item.type === "badge" ? ((item as any).icon || "🏅") : "🧪"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(item.date), "MMM d, yyyy")}</p>
                </div>
                <span className="text-xs text-muted-foreground capitalize">{item.type === "cert" ? "credential" : item.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <Button variant="outline" size="sm"
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
