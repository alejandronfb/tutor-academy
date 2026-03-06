import { Award, ExternalLink, Download, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { generateCertificatePdf } from "@/lib/generateCertificatePdf";

export default function CertificationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["certifications-page"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: courses } = await supabase.from("courses").select("id, title, icon, certificate_title, slug").not("certificate_title", "is", null).order("sort_order");
      let earned: any[] = [];
      let tutorName = "";
      if (user) {
        const { data: certs } = await supabase.from("certifications").select("*, courses(title, icon)").eq("tutor_id", user.id);
        earned = certs || [];
        const { data: profile } = await supabase.from("tutor_profiles").select("full_name").eq("id", user.id).maybeSingle();
        tutorName = profile?.full_name || "";
      }
      return { courses: courses || [], earned, userId: user?.id, tutorName };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const { courses, earned, tutorName } = data!;
  const earnedCourseIds = earned.map((c: any) => c.course_id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Certifications</h1>
        <p className="text-sm text-muted-foreground mt-1">Professional credentials you've earned</p>
      </div>

      {earned.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Earned Certifications</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {earned.map((cert: any) => (
              <div key={cert.id} className="rounded-xl border bg-card p-5 shadow-card flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground text-sm">{cert.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Issued {format(new Date(cert.issued_at), "MMM d, yyyy")}</p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">✓ Earned</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                      <Link to={`/verify/${cert.verification_id}`}>
                        <ExternalLink className="h-3 w-3 mr-1" /> Verify
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => generateCertificatePdf({
                        tutorName,
                        certTitle: cert.title,
                        issuedAt: format(new Date(cert.issued_at), "MMMM d, yyyy"),
                        verificationId: cert.verification_id,
                      })}
                    >
                      <Download className="h-3 w-3 mr-1" /> Download PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/verify/${cert.verification_id}`)}`;
                        window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
                      }}
                    >
                      <Linkedin className="h-3 w-3 mr-1" /> LinkedIn
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Certifications</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course: any) => {
            const isEarned = earnedCourseIds.includes(course.id);
            return (
              <div key={course.id} className="rounded-xl border bg-card p-5 shadow-card flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                  {course.icon || "📚"}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground text-sm">{course.certificate_title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Complete: {course.title}</p>
                  <div className="mt-3 flex gap-2">
                    {isEarned ? (
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">✓ Earned</span>
                    ) : (
                      <Button size="sm" variant="outline" className="h-6 text-xs" asChild>
                        <Link to={`/dashboard/courses/${course.slug}`}>Start Course</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}