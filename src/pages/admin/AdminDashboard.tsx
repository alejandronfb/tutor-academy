import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, BookOpen, TrendingUp, BarChart3 } from "lucide-react";
import { startOfWeek } from "date-fns";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

      const [tutors, certs, weeklyCompletions, enrollments, quizAttempts] = await Promise.all([
        supabase.from("tutor_profiles").select("id", { count: "exact", head: true }),
        supabase.from("certifications").select("id", { count: "exact", head: true }),
        supabase.from("course_enrollments").select("id", { count: "exact", head: true }).gte("completed_at", weekStart),
        supabase.from("course_enrollments").select("course_id, courses(title)"),
        supabase.from("quiz_attempts").select("score"),
      ]);

      // Most popular course
      const courseCounts: Record<string, { title: string; count: number }> = {};
      (enrollments.data ?? []).forEach((e: any) => {
        const title = e.courses?.title ?? "Unknown";
        if (!courseCounts[e.course_id]) courseCounts[e.course_id] = { title, count: 0 };
        courseCounts[e.course_id].count++;
      });
      const popular = Object.values(courseCounts).sort((a, b) => b.count - a.count)[0];

      const scores = (quizAttempts.data ?? []).map((q: any) => q.score);
      const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

      return {
        totalTutors: tutors.count ?? 0,
        totalCerts: certs.count ?? 0,
        weeklyCompletions: weeklyCompletions.count ?? 0,
        popularCourse: popular?.title ?? "N/A",
        avgQuizScore: avgScore,
      };
    },
  });

  const cards = [
    { label: "Total Tutors", value: stats?.totalTutors ?? "–", icon: Users, color: "text-primary" },
    { label: "Completions This Week", value: stats?.weeklyCompletions ?? "–", icon: TrendingUp, color: "text-accent" },
    { label: "Total Certifications", value: stats?.totalCerts ?? "–", icon: Award, color: "text-primary" },
    { label: "Most Popular Course", value: stats?.popularCourse ?? "–", icon: BookOpen, color: "text-accent" },
    { label: "Avg Quiz Score", value: stats?.avgQuizScore != null ? `${stats.avgQuizScore}%` : "–", icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
