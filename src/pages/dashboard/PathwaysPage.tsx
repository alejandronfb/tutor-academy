import { ArrowRight, Lock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const PATHWAYS_DATA = [
  { id: "core", name: "Core Specialization", icon: "🎓", description: "Essential skills every professional tutor should develop", required: true },
  { id: "english", name: "English Tutor Specialization", icon: "💬", description: "Specialized techniques for teaching English conversation and to young learners" },
  { id: "stem", name: "STEM Tutor Specialization", icon: "🔬", description: "Methods for teaching math, science, and analytical subjects effectively" },
  { id: "writing", name: "Writing Tutor Specialization", icon: "✍️", description: "Skills for guiding students through academic and creative writing" },
  { id: "modality", name: "Modality Specialization", icon: "📹", description: "Master the unique skills required for your preferred teaching format" },
];

const pathwayMap: Record<string, string> = {
  "Core": "core", "English": "english", "STEM": "stem", "Writing": "writing", "Modality": "modality"
};

export default function PathwaysPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["pathways-page"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: courses } = await supabase.from("courses").select("id, title, slug, pathway, certificate_title, status, release_at").eq("status", "published").order("sort_order");
      const { data: prereqs } = await (supabase.from("specialization_prerequisites") as any).select("course_id, prerequisite_course_id");

      let completedIds: string[] = [];
      if (user) {
        const { data: enrollments } = await supabase.from("course_enrollments").select("course_id").eq("tutor_id", user.id).not("completed_at", "is", null);
        completedIds = (enrollments || []).map((e: any) => e.course_id);
      }

      return { courses: courses || [], prereqs: prereqs || [], completedIds };
    },
  });

  if (isLoading) {
    return <div className="space-y-6 animate-fade-in"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 rounded-xl" /></div>;
  }

  const { courses, prereqs, completedIds } = data!;
  const now = new Date();

  const prereqsMet = (courseId: string) => {
    const required = prereqs.filter((p: any) => p.course_id === courseId);
    return required.every((p: any) => completedIds.includes(p.prerequisite_course_id));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Specializations</h1>
        <p className="text-sm text-muted-foreground mt-1">Focused development tracks to build advanced expertise</p>
      </div>

      <div className="space-y-6">
        {PATHWAYS_DATA.map((pathway) => {
          const pathwayCourses = courses.filter((c: any) => {
            const mapped = pathwayMap[c.pathway];
            return mapped === pathway.id && (!c.release_at || new Date(c.release_at) <= now);
          });

          return (
            <div key={pathway.id} className="rounded-xl border bg-card p-6 shadow-card">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                  {pathway.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-foreground">{pathway.name}</h2>
                    {pathway.required && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Recommended First</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{pathway.description}</p>

                  <div className="flex flex-wrap gap-3">
                    {pathwayCourses.map((course: any, ci: number) => {
                      const completed = completedIds.includes(course.id);
                      const locked = !prereqsMet(course.id);
                      return (
                        <div key={course.id} className="flex items-center gap-2">
                          {ci > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                          {locked ? (
                            <div className="rounded-lg border border-dashed bg-muted/50 p-3 opacity-60">
                              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" /> {course.title}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">Complete prerequisites first</div>
                            </div>
                          ) : (
                            <Link
                              to={`/dashboard/courses/${course.slug}`}
                              className="rounded-lg border bg-background p-3 hover:border-primary/30 hover:shadow-card-hover transition-all group"
                            >
                              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                                {completed && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                                {course.title}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">→ {course.certificate_title || "Certificate"}</div>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                    {pathwayCourses.length === 0 && (
                      <p className="text-xs text-muted-foreground">No courses available yet in this specialization.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Level progression */}
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Track Progression</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { level: 1, name: "Certified Tutor", req: "Complete Foundations course", color: "bg-muted" },
            { level: 2, name: "Advanced Tutor", req: "+2 specialization courses + 1 modality course", color: "bg-primary/10" },
            { level: 3, name: "Expert Tutor", req: "All courses in primary specialization + skills check", color: "bg-primary/10" },
            { level: 4, name: "Master Tutor", req: "All certifications + 500 hours logged", color: "gradient-navy" },
          ].map((level) => (
            <div key={level.level} className={`rounded-xl p-4 ${level.level === 4 ? "gradient-navy" : "border"}`}>
              <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${level.level === 4 ? "text-accent" : "text-muted-foreground"}`}>Level {level.level}</div>
              <div className={`font-semibold mb-1 ${level.level === 4 ? "text-primary-foreground" : "text-foreground"}`}>{level.name}</div>
              <div className={`text-xs ${level.level === 4 ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{level.req}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
