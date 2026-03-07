import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";

const EMPTY_COURSE = { title: "", slug: "", description: "", pathway: "Core", difficulty: "Beginner", duration_hours: 0, certificate_title: "", icon: "📚", sort_order: 0 };

export default function AdminCourses() {
  const queryClient = useQueryClient();
  const [courseDialog, setCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_COURSE);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [moduleDialog, setModuleDialog] = useState<any>(null);
  const [lessonDialog, setLessonDialog] = useState<any>(null);
  const [quizDialog, setQuizDialog] = useState<any>(null);

  const { data: courses = [] } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("sort_order");
      // Get enrollment counts
      const { data: enrollments } = await supabase.from("course_enrollments").select("course_id");
      const counts: Record<string, number> = {};
      (enrollments ?? []).forEach((e: any) => { counts[e.course_id] = (counts[e.course_id] ?? 0) + 1; });
      return (data ?? []).map((c: any) => ({ ...c, enrollmentCount: counts[c.id] ?? 0 }));
    },
  });

  const { data: courseModules = [] } = useQuery({
    queryKey: ["admin-modules", expandedCourse],
    enabled: !!expandedCourse,
    queryFn: async () => {
      const { data } = await supabase.from("course_modules").select("*").eq("course_id", expandedCourse).order("sort_order");
      return data ?? [];
    },
  });

  const { data: moduleLessons = [] } = useQuery({
    queryKey: ["admin-lessons", expandedCourse],
    enabled: !!expandedCourse,
    queryFn: async () => {
      const moduleIds = courseModules.map((m: any) => m.id);
      if (!moduleIds.length) return [];
      const { data } = await supabase.from("lessons").select("*").in("module_id", moduleIds).order("sort_order");
      return data ?? [];
    },
  });

  const { data: moduleQuizzes = [] } = useQuery({
    queryKey: ["admin-quizzes", expandedCourse],
    enabled: !!expandedCourse,
    queryFn: async () => {
      const { data } = await supabase.from("quizzes").select("*, quiz_questions(*)").eq("course_id", expandedCourse);
      return data ?? [];
    },
  });

  const saveCourse = useMutation({
    mutationFn: async (values: any) => {
      const { enrollmentCount, ...clean } = values;
      if (editingCourse) {
        const { error } = await supabase.from("courses").update(clean).eq("id", editingCourse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(clean);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setCourseDialog(false);
      setEditingCourse(null);
      toast.success("Course saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveModule = useMutation({
    mutationFn: async (values: any) => {
      if (values.id) {
        const { error } = await supabase.from("course_modules").update({ title: values.title, sort_order: values.sort_order }).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("course_modules").insert({ title: values.title, course_id: expandedCourse, sort_order: values.sort_order ?? 0 });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-modules"] }); setModuleDialog(null); toast.success("Module saved"); },
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-modules"] }); toast.success("Module deleted"); },
  });

  const saveLesson = useMutation({
    mutationFn: async (values: any) => {
      if (values.id) {
        const { error } = await supabase.from("lessons").update({ title: values.title, content: values.content, sort_order: values.sort_order }).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lessons").insert({ title: values.title, content: values.content, module_id: values.module_id, sort_order: values.sort_order ?? 0 });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-lessons"] }); setLessonDialog(null); toast.success("Lesson saved"); },
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-lessons"] }); toast.success("Lesson deleted"); },
  });

  const saveQuiz = useMutation({
    mutationFn: async (values: any) => {
      const { questions, ...quiz } = values;
      let quizId = quiz.id;
      if (quizId) {
        await supabase.from("quizzes").update({ passing_score: quiz.passing_score, is_final: quiz.is_final }).eq("id", quizId);
      } else {
        const { data, error } = await supabase.from("quizzes").insert({ course_id: expandedCourse, module_id: quiz.module_id, passing_score: quiz.passing_score, is_final: quiz.is_final }).select().single();
        if (error) throw error;
        quizId = data.id;
      }
      // Delete old questions, insert new
      await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
      if (questions?.length) {
        const qs = questions.map((q: any, i: number) => ({ quiz_id: quizId, question: q.question, options: q.options, correct_index: q.correct_index, sort_order: i + 1 }));
        await supabase.from("quiz_questions").insert(qs);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] }); setQuizDialog(null); toast.success("Quiz saved"); },
  });

  const openEditCourse = (c: any) => { setEditingCourse(c); setForm(c); setCourseDialog(true); };
  const openNewCourse = () => { setEditingCourse(null); setForm(EMPTY_COURSE); setCourseDialog(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Manage Courses</h1>
        <Button onClick={openNewCourse}><Plus className="mr-1 h-4 w-4" /> New Course</Button>
      </div>

      <div className="space-y-2">
        {courses.map((c: any) => (
          <Card key={c.id}>
            <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expandedCourse === c.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="text-lg">{c.icon}</span>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <Badge variant="secondary">{c.pathway}</Badge>
                  <Badge variant="outline">{c.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{c.enrollmentCount} enrolled</span>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditCourse(c); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {expandedCourse === c.id && (
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground">Modules</h3>
                  <Button size="sm" variant="outline" onClick={() => setModuleDialog({ course_id: c.id, title: "", sort_order: courseModules.length + 1 })}>
                    <Plus className="mr-1 h-3 w-3" /> Add Module
                  </Button>
                </div>
                {courseModules.map((m: any) => {
                  const mLessons = moduleLessons.filter((l: any) => l.module_id === m.id);
                  const mQuiz = moduleQuizzes.find((q: any) => q.module_id === m.id && !q.is_final);
                  return (
                    <div key={m.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{m.sort_order}. {m.title}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setModuleDialog(m)}><Edit className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteModule.mutate(m.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      </div>
                      <div className="pl-6 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium">Lessons ({mLessons.length})</span>
                          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setLessonDialog({ module_id: m.id, title: "", content: "", sort_order: mLessons.length + 1 })}>
                            <Plus className="h-3 w-3 mr-1" />Add
                          </Button>
                        </div>
                        {mLessons.map((l: any) => (
                          <div key={l.id} className="flex items-center justify-between text-sm">
                            <span>{l.sort_order}. {l.title}</span>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-6" onClick={() => setLessonDialog(l)}><Edit className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-6" onClick={() => deleteLesson.mutate(l.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground font-medium">Quiz {mQuiz ? `(${mQuiz.quiz_questions?.length ?? 0} questions)` : "(none)"}</span>
                          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setQuizDialog({
                            id: mQuiz?.id, module_id: m.id, is_final: false, passing_score: mQuiz?.passing_score ?? 70,
                            questions: mQuiz?.quiz_questions?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ?? []
                          })}>
                            {mQuiz ? "Edit" : "Add"} Quiz
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Final Assessment */}
                {(() => {
                  const finalQuiz = moduleQuizzes.find((q: any) => q.is_final);
                  return (
                    <div className="border-t pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Final Assessment {finalQuiz ? `(${finalQuiz.quiz_questions?.length ?? 0} questions)` : "(none)"}</span>
                        <Button size="sm" variant="outline" onClick={() => setQuizDialog({
                          id: finalQuiz?.id, module_id: null, is_final: true, passing_score: finalQuiz?.passing_score ?? 80,
                          questions: finalQuiz?.quiz_questions?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ?? []
                        })}>
                          {finalQuiz ? "Edit" : "Add"} Final Assessment
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Course Dialog */}
      <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingCourse ? "Edit Course" : "New Course"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Pathway</Label>
                <Select value={form.pathway} onValueChange={(v) => setForm({ ...form, pathway: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Core", "English", "STEM", "Writing", "Modality"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Difficulty</Label>
                <Select value={form.difficulty ?? "Beginner"} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Beginner", "Intermediate", "Advanced"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Duration (h)</Label><Input type="number" value={form.duration_hours ?? 0} onChange={(e) => setForm({ ...form, duration_hours: Number(e.target.value) })} /></div>
              <div><Label>Icon</Label><Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Certificate Title</Label><Input value={form.certificate_title ?? ""} onChange={(e) => setForm({ ...form, certificate_title: e.target.value })} /></div>
            <Button className="w-full" onClick={() => saveCourse.mutate(form)}>Save Course</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={!!moduleDialog} onOpenChange={() => setModuleDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{moduleDialog?.id ? "Edit Module" : "New Module"}</DialogTitle></DialogHeader>
          {moduleDialog && (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={moduleDialog.title} onChange={(e) => setModuleDialog({ ...moduleDialog, title: e.target.value })} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={moduleDialog.sort_order ?? 0} onChange={(e) => setModuleDialog({ ...moduleDialog, sort_order: Number(e.target.value) })} /></div>
              <Button className="w-full" onClick={() => saveModule.mutate(moduleDialog)}>Save Module</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={!!lessonDialog} onOpenChange={() => setLessonDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{lessonDialog?.id ? "Edit Lesson" : "New Lesson"}</DialogTitle></DialogHeader>
          {lessonDialog && (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={lessonDialog.title} onChange={(e) => setLessonDialog({ ...lessonDialog, title: e.target.value })} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={lessonDialog.sort_order ?? 0} onChange={(e) => setLessonDialog({ ...lessonDialog, sort_order: Number(e.target.value) })} /></div>
              <div><Label>Content</Label><RichTextEditor content={lessonDialog.content} onChange={(html) => setLessonDialog({ ...lessonDialog, content: html })} /></div>
              <Button className="w-full" onClick={() => saveLesson.mutate(lessonDialog)}>Save Lesson</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <QuizEditDialog quiz={quizDialog} onClose={() => setQuizDialog(null)} onSave={(q: any) => saveQuiz.mutate(q)} />
    </div>
  );
}

function QuizEditDialog({ quiz, onClose, onSave }: { quiz: any; onClose: () => void; onSave: (q: any) => void }) {
  const [localQuiz, setLocalQuiz] = useState<any>(null);

  // Sync when quiz changes
  if (quiz && !localQuiz) {
    // defer set
    setTimeout(() => setLocalQuiz(quiz), 0);
  }

  const close = () => { setLocalQuiz(null); onClose(); };
  const questions = localQuiz?.questions ?? [];
  const setQuestions = (qs: any[]) => setLocalQuiz({ ...localQuiz, questions: qs });

  const addQuestion = () => setQuestions([...questions, { question: "", options: ["", "", "", ""], correct_index: 0 }]);
  const removeQuestion = (i: number) => setQuestions(questions.filter((_: any, j: number) => j !== i));
  const updateQ = (i: number, field: string, value: any) => {
    const q = [...questions];
    q[i] = { ...q[i], [field]: value };
    setQuestions(q);
  };
  const updateOption = (qi: number, oi: number, value: string) => {
    const q = [...questions];
    const opts = [...q[qi].options];
    opts[oi] = value;
    q[qi] = { ...q[qi], options: opts };
    setQuestions(q);
  };

  if (!quiz) return null;

  return (
    <Dialog open={!!quiz} onOpenChange={close}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{localQuiz?.is_final ? "Final Assessment" : "Module Quiz"}</DialogTitle></DialogHeader>
        {localQuiz && (
          <div className="space-y-4">
            <div><Label>Passing Score (%)</Label><Input type="number" value={localQuiz.passing_score} onChange={(e) => setLocalQuiz({ ...localQuiz, passing_score: Number(e.target.value) })} /></div>
            <div className="space-y-3">
              {questions.map((q: any, i: number) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Question {i + 1}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeQuestion(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                  <Input placeholder="Question text" value={q.question} onChange={(e) => updateQ(i, "question", e.target.value)} />
                  {[0, 1, 2, 3].map((oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${i}`} checked={q.correct_index === oi} onChange={() => updateQ(i, "correct_index", oi)} />
                      <Input placeholder={`Option ${oi + 1}`} value={q.options[oi] ?? ""} onChange={(e) => updateOption(i, oi, e.target.value)} className="flex-1" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={addQuestion}><Plus className="mr-1 h-4 w-4" /> Add Question</Button>
            <Button className="w-full" onClick={() => { onSave(localQuiz); close(); }}>Save Quiz</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
