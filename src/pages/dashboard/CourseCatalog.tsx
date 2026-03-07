import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Search, ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseCatalog() {
  const [search, setSearch] = useState("");
  const [pathwayFilter, setPathwayFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["courses-catalog"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: courses, error } = await (supabase.from("courses") as any)
        .select("*, course_modules(id)")
        .eq("status", "published")
        .order("sort_order");
      if (error) throw error;

      // Fetch prerequisites
      const { data: prereqs } = await (supabase.from("specialization_prerequisites") as any).select("course_id, prerequisite_course_id");

      // Fetch user completions
      let completedIds: string[] = [];
      if (user) {
        const { data: enrollments } = await supabase.from("course_enrollments").select("course_id").eq("tutor_id", user.id).not("completed_at", "is", null);
        completedIds = (enrollments || []).map((e: any) => e.course_id);
      }

      return { courses: (courses || []) as any[], prereqs: (prereqs || []) as any[], completedIds };
    },
  });

  const courses = data?.courses ?? [];
  const prereqs = data?.prereqs ?? [];
  const completedIds = data?.completedIds ?? [];
  const now = new Date();

  // Filter out future releases
  const availableCourses = courses.filter((c: any) => !c.release_at || new Date(c.release_at) <= now);

  const filtered = availableCourses.filter((c: any) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (pathwayFilter !== "all" && c.pathway !== pathwayFilter) return false;
    if (difficultyFilter !== "all" && c.difficulty !== difficultyFilter) return false;
    return true;
  });

  const pathways = [...new Set(availableCourses.map((c: any) => c.pathway))];

  // Check if prerequisites are met for a course
  const prereqsMet = (courseId: string) => {
    const required = prereqs.filter((p: any) => p.course_id === courseId);
    return required.every((p: any) => completedIds.includes(p.prerequisite_course_id));
  };

  const getUnmetPrereqs = (courseId: string) => {
    const required = prereqs.filter((p: any) => p.course_id === courseId);
    return required
      .filter((p: any) => !completedIds.includes(p.prerequisite_course_id))
      .map((p: any) => courses.find((c: any) => c.id === p.prerequisite_course_id)?.title)
      .filter(Boolean);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Learning Library</h1>
        <p className="text-sm text-muted-foreground mt-1">Practical courses for your professional development</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={pathwayFilter} onValueChange={setPathwayFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Specialization" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specializations</SelectItem>
            {pathways.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-6 shadow-card space-y-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course: any) => {
            const locked = !prereqsMet(course.id);
            const unmet = getUnmetPrereqs(course.id);
            return (
              <div key={course.id} className={`rounded-xl border bg-card p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 flex flex-col ${locked ? "opacity-75" : ""}`}>
                <div className="text-3xl mb-3">{course.icon || "📚"}</div>
                <div className="flex gap-2 mb-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{course.pathway}</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{course.difficulty}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-1">{course.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration_hours}h</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.course_modules?.length ?? 0} modules</span>
                </div>
                {locked ? (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Lock className="h-3 w-3" /> Complete {unmet[0]} first
                    </div>
                    <Button size="sm" className="w-full" disabled>
                      <Lock className="mr-1 h-3 w-3" /> Locked
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" className="w-full" asChild>
                    <Link to={`/dashboard/courses/${course.slug}`}>
                      View Course <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses match your filters.</p>
        </div>
      )}
    </div>
  );
}
