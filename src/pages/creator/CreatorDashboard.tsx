import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreatorDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["creator-dashboard"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if admin
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });

      let coursesQuery = (supabase.from("courses") as any).select("id, title");
      if (!isAdmin) {
        coursesQuery = coursesQuery.eq("created_by", user.id);
      }
      const { data: courses } = await coursesQuery;
      const courseIds = (courses ?? []).map(c => c.id);

      let totalEnrollments = 0;
      if (courseIds.length > 0) {
        const { count } = await supabase
          .from("course_enrollments")
          .select("*", { count: "exact", head: true })
          .in("course_id", courseIds);
        totalEnrollments = count ?? 0;
      }

      return {
        courseCount: courses?.length ?? 0,
        totalEnrollments,
        isAdmin,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Studio</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage course content</p>
        </div>
        <Button asChild>
          <Link to="/creator/courses"><Plus className="mr-1 h-4 w-4" /> Create Course</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {data?.isAdmin ? "All Courses" : "My Courses"}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{data?.courseCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{data?.totalEnrollments ?? 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
