import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Award, Trophy, Flame, ArrowRight, TrendingUp, Calendar, Clock, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TUTOR_LEVELS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent } from "@/lib/trackEvent";
import { format, differenceInDays } from "date-fns";

export default function DashboardHome() {
  useEffect(() => { trackEvent("dashboard_viewed"); }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-home"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [profileRes, certsRes, badgesRes, allCoursesRes, enrollmentsRes] = await Promise.all([
        supabase.from("tutor_profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("certifications").select("*, courses(title, icon, slug, certification_type, certification_validity_months)").eq("tutor_id", user.id),
        supabase.from("user_badges").select("id").eq("tutor_id", user.id),
        supabase.from("courses").select("id, title, icon, slug, pathway, duration_hours, difficulty, release_at, status").eq("status", "published").order("sort_order"),
        supabase.from("course_enrollments").select("course_id, completed_at").eq("tutor_id", user.id),
      ]);

      // Activity status
      const { data: activityStatus } = await supabase.rpc("get_activity_status", { p_tutor_id: user.id });

      // Proficiency results
      const { data: profResults } = await supabase.from("proficiency_results").select("taken_at").eq("tutor_id", user.id).order("taken_at", { ascending: false }).limit(1);

      const totalPublished = (allCoursesRes.data || []).filter((c: any) => !c.release_at || new Date(c.release_at) <= new Date());
      const completedCourseIds = new Set((enrollmentsRes.data || []).filter((e: any) => e.completed_at).map((e: any) => e.course_id));
      const enrolledCourseIds = new Set((enrollmentsRes.data || []).map((e: any) => e.course_id));
      const completedCourses = completedCourseIds.size;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const monthStr = startOfMonth.toISOString();

      const [monthlyLessons, monthlyBadges] = await Promise.all([
        supabase.from("lesson_completions").select("id", { count: "exact", head: true }).eq("tutor_id", user.id).gte("completed_at", monthStr),
        supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("tutor_id", user.id).gte("unlocked_at", monthStr),
      ]);

      const monthlyEnrollments = (enrollmentsRes.data || []).filter((e: any) => e.completed_at && new Date(e.completed_at) >= startOfMonth).length;

      // Continue learning: enrolled but not completed
      const inProgressCourses = totalPublished.filter((c: any) => enrolledCourseIds.has(c.id) && !completedCourseIds.has(c.id));

      // Newly available (released in last 30 days, not yet started)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newlyAvailable = totalPublished.filter((c: any) =>
        c.release_at && new Date(c.release_at) > thirtyDaysAgo && new Date(c.release_at) <= new Date() && !enrolledCourseIds.has(c.id)
      );

      // Renew soon: certs expiring within 60 days
      const certs = certsRes.data || [];
      const renewSoon = certs.filter((c: any) => {
        if (!c.expires_at) return false;
        const daysLeft = differenceInDays(new Date(c.expires_at), new Date());
        return daysLeft <= 60;
      });

      // Recommended next step: first uncompleted course in primary specialization
      const profile = profileRes.data;
      const primarySpec = profile?.specializations?.[0];
      let recommendedCourse = null;
      if (primarySpec) {
        recommendedCourse = totalPublished.find((c: any) => c.pathway === primarySpec && !completedCourseIds.has(c.id));
      }
      if (!recommendedCourse) {
        recommendedCourse = totalPublished.find((c: any) => !completedCourseIds.has(c.id));
      }

      // Quick wins: short uncompleted courses
      const quickWins = totalPublished.filter((c: any) => !completedCourseIds.has(c.id) && c.duration_hours && c.duration_hours < 4).slice(0, 3);

      // Skills check cadence
      const lastProficiency = profResults?.[0];
      const skillsCheckStale = lastProficiency ? differenceInDays(new Date(), new Date(lastProficiency.taken_at)) > 180 : false;

      return {
        profile,
        certCount: certs.length,
        badgeCount: badgesRes.data?.length || 0,
        completedCourses,
        totalCourses: totalPublished.length,
        monthly: { courses: monthlyEnrollments, lessons: monthlyLessons.count || 0, badges: monthlyBadges.count || 0 },
        inProgressCourses,
        newlyAvailable,
        renewSoon,
        recommendedCourse,
        quickWins,
        recentCerts: certs.slice(0, 3),
        activityStatus: activityStatus || "inactive",
        skillsCheckStale,
        allDone: totalPublished.length > 0 && completedCourses >= totalPublished.length,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const { profile, certCount, badgeCount, completedCourses, totalCourses, monthly, inProgressCourses, newlyAvailable, renewSoon, recommendedCourse, quickWins, recentCerts, activityStatus, skillsCheckStale, allDone } = data;
  const levelInfo = TUTOR_LEVELS[(profile?.tutor_level || 1) as keyof typeof TUTOR_LEVELS];

  // Activity-aware welcome
  const welcomeMessage = activityStatus === "active"
    ? "Build your professional credentials with practical learning and verified achievements."
    : activityStatus === "recently_active"
      ? "Welcome back! Pick up where you left off with a quick refresher."
      : "Welcome back! Explore easy re-entry courses to get started again.";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl gradient-navy p-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-foreground">
            {activityStatus === "inactive" ? "Welcome back" : "Welcome back"}{profile ? `, ${profile.full_name.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="text-sm text-primary-foreground/60 mt-1">{welcomeMessage}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-4 py-2">
            <span className="text-sm font-medium text-primary-foreground">{levelInfo.name}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-4 py-2">
            <Flame className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-primary-foreground">{profile?.learning_streak || 0} day streak</span>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Learning Completed", value: `${completedCourses}/${totalCourses}`, icon: BookOpen, color: "text-primary" },
          { label: "Credentials Earned", value: String(certCount), icon: Award, color: "text-accent" },
          { label: "Badges Earned", value: String(badgeCount), icon: Trophy, color: "text-warning" },
          { label: "Current Track", value: levelInfo.name, icon: TrendingUp, color: "text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Your Progress This Month */}
      <div className="rounded-xl border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-blue-light">
            <Calendar className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Your Progress This Month</p>
            <p className="text-sm text-muted-foreground">Private summary of your recent activity</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-foreground">{monthly.courses}</p>
            <p className="text-xs text-muted-foreground">Courses Completed</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-foreground">{monthly.lessons}</p>
            <p className="text-xs text-muted-foreground">Lessons Completed</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-foreground">{monthly.badges}</p>
            <p className="text-xs text-muted-foreground">Badges Earned</p>
          </div>
        </div>
      </div>

      {/* Continue Learning */}
      {inProgressCourses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Continue Learning</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {inProgressCourses.slice(0, 3).map((course: any) => (
              <div key={course.id} className="rounded-xl border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="text-3xl mb-3">{course.icon || "📚"}</div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{course.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{course.duration_hours}h • {course.difficulty}</p>
                <Button size="sm" className="w-full" asChild>
                  <Link to={`/dashboard/courses/${course.slug}`}>Continue <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newly Available */}
      {newlyAvailable.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Newly Available
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {newlyAvailable.slice(0, 3).map((course: any) => (
              <div key={course.id} className="rounded-xl border border-primary/20 bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="text-3xl mb-3">{course.icon || "📚"}</div>
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary mb-2">New</span>
                <h3 className="font-semibold text-foreground text-sm mb-1">{course.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{course.duration_hours}h • {course.difficulty}</p>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link to={`/dashboard/courses/${course.slug}`}>Begin Learning</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Renew Soon */}
      {renewSoon.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-amber-600" /> Renew Soon
          </h2>
          <div className="space-y-3">
            {renewSoon.map((cert: any) => {
              const daysLeft = differenceInDays(new Date(cert.expires_at), new Date());
              const expired = daysLeft < 0;
              return (
                <div key={cert.id} className={`rounded-xl border p-4 ${expired ? "border-destructive/30 bg-destructive/5" : "border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{cert.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {expired ? `Expired ${format(new Date(cert.expires_at), "MMM d, yyyy")}` : `Expires ${format(new Date(cert.expires_at), "MMM d, yyyy")} (${daysLeft} days)`}
                      </p>
                    </div>
                    <Button size="sm" variant={expired ? "destructive" : "outline"} asChild>
                      <Link to={`/dashboard/courses/${(cert.courses as any)?.slug}`}>Renew</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills Check Prompt */}
      {skillsCheckStale && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">It's been a while since your last Skills Check</p>
            <p className="text-xs text-muted-foreground">Retake to track your progress — we recommend every 6 months.</p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link to="/dashboard/proficiency">Retake Skills Check</Link>
          </Button>
        </div>
      )}

      {/* Recommended Next Step */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recommended Next Step</h2>
        {recommendedCourse ? (
          <div className="rounded-xl border bg-card p-5 shadow-card flex items-center gap-4">
            <div className="text-3xl">{recommendedCourse.icon || "📚"}</div>
            <div className="flex-1">
              <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary mb-1">{recommendedCourse.pathway}</span>
              <h3 className="font-semibold text-foreground text-sm">{recommendedCourse.title}</h3>
              <p className="text-xs text-muted-foreground">{recommendedCourse.duration_hours}h • {recommendedCourse.difficulty}</p>
            </div>
            <Button size="sm" asChild>
              <Link to={`/dashboard/courses/${recommendedCourse.slug}`}>Begin Learning</Link>
            </Button>
          </div>
        ) : allDone ? (
          <div className="rounded-xl border bg-card p-5 shadow-card text-center">
            <p className="text-sm text-muted-foreground">🎉 You've completed all available learning. Check back for new content.</p>
          </div>
        ) : null}
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground" /> Quick Wins</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {quickWins.map((course: any) => (
              <div key={course.id} className="rounded-xl border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="text-3xl mb-3">{course.icon || "📚"}</div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{course.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{course.duration_hours}h • {course.difficulty}</p>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link to={`/dashboard/courses/${course.slug}`}>Begin Learning</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your Credentials */}
      {recentCerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Your Credentials</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/certifications">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recentCerts.map((cert: any) => (
              <div key={cert.id} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cert.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(cert.issued_at), "MMM yyyy")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
