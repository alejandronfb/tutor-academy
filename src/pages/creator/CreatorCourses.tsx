import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Copy, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CreatorCourses() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [confirmDuplicate, setConfirmDuplicate] = useState<{ id: string; title: string } | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["creator-courses"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });

      let query = (supabase.from("courses") as any).select("*").order("sort_order");
      if (!isAdmin) {
        query = query.eq("created_by", user.id);
      }
      const { data: coursesData } = await query;

      const { data: enrollments } = await supabase.from("course_enrollments").select("course_id");
      const counts: Record<string, number> = {};
      (enrollments ?? []).forEach((e: any) => { counts[e.course_id] = (counts[e.course_id] ?? 0) + 1; });

      return (coursesData ?? []).map((c: any) => ({ ...c, enrollmentCount: counts[c.id] ?? 0 }));
    },
  });

  const createCourse = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = `new-course-${Date.now()}`;
      const { data, error } = await (supabase.from("courses") as any).insert({
        title: "New Course",
        slug,
        pathway: "Core",
        status: "draft",
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      navigate(`/creator/courses/${data.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const duplicateCourse = useMutation({
    mutationFn: async (courseId: string) => {
      setDuplicating(courseId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: original } = await supabase.from("courses").select("*").eq("id", courseId).single();
      if (!original) throw new Error("Course not found");

      const { data: newCourse, error: courseErr } = await (supabase.from("courses") as any).insert({
        title: `${original.title} (Copy)`,
        slug: `${original.slug}-copy-${Date.now()}`,
        description: original.description,
        pathway: original.pathway,
        difficulty: original.difficulty,
        duration_hours: original.duration_hours,
        certificate_title: original.certificate_title,
        certificate_template: (original as any).certificate_template,
        icon: original.icon,
        status: "draft",
        created_by: user.id,
        sort_order: original.sort_order,
      }).select().single();
      if (courseErr) throw courseErr;

      const { data: modules } = await supabase.from("course_modules").select("*").eq("course_id", courseId).order("sort_order");
      for (const mod of modules ?? []) {
        const { data: newMod } = await supabase.from("course_modules").insert({
          course_id: newCourse.id,
          title: mod.title,
          sort_order: mod.sort_order,
        }).select().single();
        if (!newMod) continue;

        const { data: lessons } = await supabase.from("lessons").select("*").eq("module_id", mod.id).order("sort_order");
        for (const lesson of lessons ?? []) {
          await supabase.from("lessons").insert({
            module_id: newMod.id,
            title: lesson.title,
            content: lesson.content,
            sort_order: lesson.sort_order,
          });
        }

        const { data: quizzes } = await supabase.from("quizzes").select("*, quiz_questions(*)").eq("module_id", mod.id);
        for (const quiz of quizzes ?? []) {
          const { data: newQuiz } = await supabase.from("quizzes").insert({
            course_id: newCourse.id,
            module_id: newMod.id,
            passing_score: quiz.passing_score,
            is_final: quiz.is_final,
          }).select().single();
          if (newQuiz && quiz.quiz_questions?.length) {
            await supabase.from("quiz_questions").insert(
              quiz.quiz_questions.map((q: any) => ({
                quiz_id: newQuiz.id,
                question: q.question,
                options: q.options,
                correct_index: q.correct_index,
                sort_order: q.sort_order,
              }))
            );
          }
        }
      }

      const { data: finalQuizzes } = await supabase.from("quizzes").select("*, quiz_questions(*)").eq("course_id", courseId).is("module_id", null).eq("is_final", true);
      for (const quiz of finalQuizzes ?? []) {
        const { data: newQuiz } = await supabase.from("quizzes").insert({
          course_id: newCourse.id,
          module_id: null,
          passing_score: quiz.passing_score,
          is_final: true,
        }).select().single();
        if (newQuiz && quiz.quiz_questions?.length) {
          await supabase.from("quiz_questions").insert(
            quiz.quiz_questions.map((q: any) => ({
              quiz_id: newQuiz.id,
              question: q.question,
              options: q.options,
              correct_index: q.correct_index,
              sort_order: q.sort_order,
            }))
          );
        }
      }

      return newCourse;
    },
    onSuccess: (data) => {
      setDuplicating(null);
      setConfirmDuplicate(null);
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      navigate(`/creator/courses/${data.id}`);
      toast.success("Course duplicated successfully");
    },
    onError: (e: any) => { setDuplicating(null); setConfirmDuplicate(null); toast.error(e.message); },
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Courses</h1>
        <Button onClick={() => createCourse.mutate()} disabled={createCourse.isPending}>
          {createCourse.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
          Create Course
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Pathway</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.icon || "📚"}</span>
                      <div>
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{c.difficulty}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{c.pathway}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={c.status === "published" ? "default" : "outline"}>
                      {c.status || "draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.enrollmentCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/creator/courses/${c.id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        disabled={duplicating === c.id}
                        onClick={() => setConfirmDuplicate({ id: c.id, title: c.title })}
                      >
                        {duplicating === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && courses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No courses yet. Create your first one!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDuplicate} onOpenChange={(open) => !open && setConfirmDuplicate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate "{confirmDuplicate?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a copy of the course including all modules, lessons, quizzes, and questions. The copy will be saved as a draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDuplicate && duplicateCourse.mutate(confirmDuplicate.id)}>
              Duplicate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
