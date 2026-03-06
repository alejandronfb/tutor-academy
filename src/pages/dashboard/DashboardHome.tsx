import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Award, Trophy, Flame, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TUTOR_LEVELS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-home"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [profileRes, certsRes, badgesRes, coursesRes, enrollmentsRes] = await Promise.all([
        supabase.from("tutor_profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("certifications").select("id").eq("tutor_id", user.id),
        supabase.from("user_badges").select("id").eq("tutor_id", user.id),
        supabase.from("courses").select("id, title, icon, slug, pathway, duration_hours, difficulty").order("sort_order").limit(3),
        supabase.from("course_enrollments").select("course_id, completed_at").eq("tutor_id", user.id),
      ]);

      const totalCourses = (await supabase.from("courses").select("id", { count: "exact", head: true })).count || 0;
      const completedCourses = (enrollmentsRes.data || []).filter((e) => e.completed_at).length;

      return {
        profile: profileRes.data,
        certCount: certsRes.data?.length || 0,
        badgeCount: badgesRes.data?.length || 0,
        completedCourses,
        totalCourses,
        courses: coursesRes.data || [],
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

  const { profile, certCount, badgeCount, completedCourses, totalCourses, courses } = data;
  const levelInfo = TUTOR_LEVELS[(profile?.tutor_level || 1) as keyof typeof TUTOR_LEVELS];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl gradient-navy p-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-foreground">
            Welcome back{profile ? `, ${profile.full_name.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="text-sm text-primary-foreground/60 mt-1">Continue building your teaching expertise</p>
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
          { label: "Courses Completed", value: `${completedCourses}/${totalCourses}`, icon: BookOpen, color: "text-primary" },
          { label: "Certifications Earned", value: String(certCount), icon: Award, color: "text-accent" },
          { label: "Badges Unlocked", value: String(badgeCount), icon: Trophy, color: "text-warning" },
          { label: "Current Level", value: levelInfo.name, icon: TrendingUp, color: "text-primary" },
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

      {/* Activity ranking */}
      <div className="rounded-xl border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-blue-light">
            <TrendingUp className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {completedCourses > 0 ? `You've completed ${completedCourses} course${completedCourses > 1 ? "s" : ""}! Keep going! 🚀` : "You're making great progress! 🚀"}
            </p>
            <p className="text-sm text-muted-foreground">
              {completedCourses === 0 ? "Complete your first course to see your activity ranking among academy tutors." : "Continue learning to unlock more badges and certifications."}
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recommended Courses</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/courses">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {courses.map((course: any) => (
            <div key={course.id} className="rounded-xl border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="text-3xl mb-3">{course.icon || "📚"}</div>
              <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary mb-2">{course.pathway}</span>
              <h3 className="font-semibold text-foreground text-sm mb-1">{course.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{course.duration_hours}h • {course.difficulty}</p>
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link to={`/dashboard/courses/${course.slug}`}>Start Course</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="grid gap-4 md:grid-cols-3">
        {["AI Teaching Coach", "Teaching Simulations", "Live Workshops"].map((feature) => (
          <div key={feature} className="rounded-xl border border-dashed bg-card/50 p-5 text-center">
            <div className="text-2xl mb-2">🔮</div>
            <h3 className="font-medium text-foreground text-sm">{feature}</h3>
            <span className="inline-block mt-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Coming Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}