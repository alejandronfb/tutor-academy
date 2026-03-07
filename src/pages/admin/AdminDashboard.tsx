import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, BookOpen, TrendingUp, BarChart3, AlertTriangle, Database, Activity } from "lucide-react";
import { startOfWeek, startOfMonth } from "date-fns";

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

  const { data: seedStats } = useQuery({
    queryKey: ["admin-seed-stats"],
    queryFn: async () => {
      const [courses, profQ, badges, codes, tutors] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        (supabase.from("proficiency_questions") as any).select("id", { count: "exact", head: true }),
        supabase.from("badges").select("id", { count: "exact", head: true }),
        supabase.from("invitation_codes").select("id", { count: "exact", head: true }).is("used_by", null),
        supabase.from("tutor_profiles").select("id", { count: "exact", head: true }),
      ]);
      return {
        coursesPublished: courses.count ?? 0,
        proficiencyQuestions: profQ.count ?? 0,
        badgesDefined: badges.count ?? 0,
        codesAvailable: codes.count ?? 0,
        activeTutors: tutors.count ?? 0,
      };
    },
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
      const monthStart = startOfMonth(new Date()).toISOString();

      const { data: weekEvents } = await (supabase.from("analytics_events" as any) as any)
        .select("event_type, tutor_id")
        .gte("created_at", weekStart);

      const events = weekEvents || [];
      const eventsThisWeek = events.length;
      const activeTutorsThisWeek = new Set(events.map((e: any) => e.tutor_id)).size;

      // Top events
      const eventCounts: Record<string, number> = {};
      events.forEach((e: any) => {
        eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
      });
      const topEvents = Object.entries(eventCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Monthly course completions & certs
      const [monthCompletions, monthCerts] = await Promise.all([
        supabase.from("course_enrollments").select("id", { count: "exact", head: true }).gte("completed_at", monthStart).not("completed_at", "is", null),
        supabase.from("certifications").select("id", { count: "exact", head: true }).gte("issued_at", monthStart),
      ]);

      return {
        eventsThisWeek,
        activeTutorsThisWeek,
        topEvents,
        courseCompletionsThisMonth: monthCompletions.count ?? 0,
        certsThisMonth: monthCerts.count ?? 0,
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

  const needsSetup = seedStats && (seedStats.coursesPublished === 0 || seedStats.proficiencyQuestions === 0 || seedStats.badgesDefined === 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

      {needsSetup && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-400">The academy needs seed data</p>
            <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">Use the Content Studio to create courses or run the seed migration.</p>
          </div>
        </div>
      )}

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

      {/* Platform Status */}
      {seedStats && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" /> Platform Status
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Courses Published", value: seedStats.coursesPublished, ok: seedStats.coursesPublished > 0 },
              { label: "Badges Defined", value: seedStats.badgesDefined, ok: seedStats.badgesDefined > 0 },
              { label: "Skills Check Questions", value: seedStats.proficiencyQuestions, ok: seedStats.proficiencyQuestions >= 40 },
              { label: "Invitation Codes", value: seedStats.codesAvailable, ok: seedStats.codesAvailable > 0 },
              { label: "Active Tutors", value: seedStats.activeTutors, ok: seedStats.activeTutors > 0 },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.ok ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"}`}>
                      {item.ok ? "✓" : "⚠️"}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                  {!item.ok && <p className="text-xs text-amber-600 mt-1">⚠️ Needs setup</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analytics */}
      {analyticsData && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" /> Analytics
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <span className="text-sm text-muted-foreground">Events This Week</span>
                <p className="text-2xl font-bold text-foreground mt-1">{analyticsData.eventsThisWeek}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <span className="text-sm text-muted-foreground">Active Tutors This Week</span>
                <p className="text-2xl font-bold text-foreground mt-1">{analyticsData.activeTutorsThisWeek}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <span className="text-sm text-muted-foreground">Course Completions (Month)</span>
                <p className="text-2xl font-bold text-foreground mt-1">{analyticsData.courseCompletionsThisMonth}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <span className="text-sm text-muted-foreground">Credentials Issued (Month)</span>
                <p className="text-2xl font-bold text-foreground mt-1">{analyticsData.certsThisMonth}</p>
              </CardContent>
            </Card>
          </div>
          {analyticsData.topEvents.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Events This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.topEvents.map(([event, count]: [string, number]) => (
                    <div key={event} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{event}</span>
                      <span className="text-sm font-medium text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
