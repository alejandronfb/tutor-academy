import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Save, Loader2, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import RichTextRenderer from "@/components/RichTextRenderer";

export default function CreatorCourseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [quizDialog, setQuizDialog] = useState<any>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ["creator-course", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["creator-modules", id],
    queryFn: async () => {
      const { data } = await supabase.from("course_modules").select("*").eq("course_id", id!).order("sort_order");
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["creator-lessons", id],
    queryFn: async () => {
      const moduleIds = modules.map(m => m.id);
      if (!moduleIds.length) return [];
      const { data } = await supabase.from("lessons").select("*").in("module_id", moduleIds).order("sort_order");
      return data ?? [];
    },
    enabled: modules.length > 0,
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["creator-quizzes", id],
    queryFn: async () => {
      const { data } = await supabase.from("quizzes").select("*, quiz_questions(*)").eq("course_id", id!);
      return data ?? [];
    },
    enabled: !!id,
  });

  const [form, setForm] = useState<any>(null);
  // Sync form with course data
  if (course && !form) {
    setTimeout(() => setForm({ ...course }), 0);
  }

  const saveCourse = useMutation({
    mutationFn: async (values: any) => {
      // Auto-gen slug from title if empty
      if (!values.slug) values.slug = values.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { error } = await (supabase.from("courses") as any).update({
        title: values.title,
        slug: values.slug,
        description: values.description,
        pathway: values.pathway,
        difficulty: values.difficulty,
        duration_hours: values.duration_hours,
        certificate_title: values.certificate_title,
        certificate_template: values.certificate_template,
        icon: values.icon,
        status: values.status,
      }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-course", id] });
      toast.success("Course saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const publishCourse = useMutation({
    mutationFn: async () => {
      // Check if has at least 1 module with 1 lesson
      const moduleIds = modules.map(m => m.id);
      if (moduleIds.length === 0) throw new Error("Need at least 1 module with 1 lesson to publish");
      const lessonCount = lessons.filter(l => moduleIds.includes(l.module_id!)).length;
      if (lessonCount === 0) throw new Error("Need at least 1 lesson to publish");

      const { error } = await (supabase.from("courses") as any).update({ status: "published" }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ ...form, status: "published" });
      queryClient.invalidateQueries({ queryKey: ["creator-course", id] });
      toast.success("Course published!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Module CRUD
  const addModule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("course_modules").insert({
        course_id: id,
        title: `Module ${modules.length + 1}`,
        sort_order: modules.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["creator-modules"] }); toast.success("Module added"); },
  });

  const updateModule = useMutation({
    mutationFn: async ({ moduleId, title }: { moduleId: string; title: string }) => {
      const { error } = await supabase.from("course_modules").update({ title }).eq("id", moduleId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creator-modules"] }),
  });

  const deleteModule = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase.from("course_modules").delete().eq("id", moduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-modules"] });
      queryClient.invalidateQueries({ queryKey: ["creator-lessons"] });
      toast.success("Module deleted");
    },
  });

  const reorderModule = useMutation({
    mutationFn: async ({ moduleId, newOrder }: { moduleId: string; newOrder: number }) => {
      await supabase.from("course_modules").update({ sort_order: newOrder }).eq("id", moduleId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creator-modules"] }),
  });

  // Lesson CRUD
  const addLesson = useMutation({
    mutationFn: async (moduleId: string) => {
      const moduleLessons = lessons.filter(l => l.module_id === moduleId);
      const { error } = await supabase.from("lessons").insert({
        module_id: moduleId,
        title: `New Lesson`,
        content: "<p>Start writing your lesson content here...</p>",
        sort_order: moduleLessons.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["creator-lessons"] }); toast.success("Lesson added"); },
  });

  const saveLesson = useMutation({
    mutationFn: async (lesson: any) => {
      const { error } = await supabase.from("lessons").update({
        title: lesson.title,
        content: lesson.content,
        sort_order: lesson.sort_order,
      }).eq("id", lesson.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-lessons"] });
      setEditingLesson(null);
      toast.success("Lesson saved");
    },
  });

  const deleteLesson = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["creator-lessons"] }); toast.success("Lesson deleted"); },
  });

  // Quiz CRUD
  const saveQuiz = useMutation({
    mutationFn: async (values: any) => {
      const { questions, ...quiz } = values;
      let quizId = quiz.id;
      if (quizId) {
        await supabase.from("quizzes").update({ passing_score: quiz.passing_score, is_final: quiz.is_final }).eq("id", quizId);
      } else {
        const { data, error } = await supabase.from("quizzes").insert({
          course_id: id,
          module_id: quiz.module_id,
          passing_score: quiz.passing_score,
          is_final: quiz.is_final,
        }).select().single();
        if (error) throw error;
        quizId = data.id;
      }
      await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
      if (questions?.length) {
        const qs = questions.map((q: any, i: number) => ({
          quiz_id: quizId,
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          sort_order: i + 1,
        }));
        await supabase.from("quiz_questions").insert(qs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-quizzes"] });
      setQuizDialog(null);
      toast.success("Quiz saved");
    },
  });

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/creator/courses")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <h1 className="text-xl font-bold text-foreground">{form.title}</h1>
        </div>
        <div className="flex gap-2">
          {form.status !== "published" && (
            <Button variant="outline" onClick={() => publishCourse.mutate()} disabled={publishCourse.isPending}>
              {publishCourse.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Publish
            </Button>
          )}
          <Button onClick={() => saveCourse.mutate(form)} disabled={saveCourse.isPending}>
            {saveCourse.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="modules">Modules & Lessons</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Tab 1: Course Details */}
        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Pathway</Label>
                  <Select value={form.pathway} onValueChange={v => setForm({ ...form, pathway: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Core", "English", "STEM", "Writing", "Modality"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty ?? "Beginner"} onValueChange={v => setForm({ ...form, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Beginner", "Intermediate", "Advanced"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status ?? "draft"} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Duration (hours)</Label><Input type="number" value={form.duration_hours ?? 0} onChange={e => setForm({ ...form, duration_hours: Number(e.target.value) })} /></div>
                <div><Label>Icon (emoji)</Label><Input value={form.icon ?? ""} onChange={e => setForm({ ...form, icon: e.target.value })} /></div>
                <div>
                  <Label>Certificate Template</Label>
                  <Select value={form.certificate_template ?? "classic"} onValueChange={v => setForm({ ...form, certificate_template: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">🏛️ Classic</SelectItem>
                      <SelectItem value="modern">✨ Modern</SelectItem>
                      <SelectItem value="elegant">🎓 Elegant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Certificate Title</Label><Input value={form.certificate_title ?? ""} onChange={e => setForm({ ...form, certificate_title: e.target.value })} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Modules & Lessons */}
        <TabsContent value="modules">
          <div className="space-y-3">
            <Accordion type="multiple" className="space-y-2">
              {modules.map((mod: any, mi: number) => {
                const modLessons = lessons.filter(l => l.module_id === mod.id);
                return (
                  <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium">{mod.sort_order}. {mod.title}</span>
                        <span className="text-xs text-muted-foreground">({modLessons.length} lessons)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={mod.title}
                            onChange={e => updateModule.mutate({ moduleId: mod.id, title: e.target.value })}
                            className="flex-1"
                            placeholder="Module title"
                          />
                          <Button variant="ghost" size="sm" disabled={mi === 0} onClick={() => {
                            const prev = modules[mi - 1];
                            reorderModule.mutate({ moduleId: mod.id, newOrder: prev.sort_order });
                            reorderModule.mutate({ moduleId: prev.id, newOrder: mod.sort_order });
                          }}><ArrowUp className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" disabled={mi === modules.length - 1} onClick={() => {
                            const next = modules[mi + 1];
                            reorderModule.mutate({ moduleId: mod.id, newOrder: next.sort_order });
                            reorderModule.mutate({ moduleId: next.id, newOrder: mod.sort_order });
                          }}><ArrowDown className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this module and all its lessons?")) deleteModule.mutate(mod.id); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {modLessons.map((lesson: any) => (
                          <div key={lesson.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{lesson.sort_order}. {lesson.title}</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setEditingLesson({ ...lesson })}>
                                  Edit
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this lesson?")) deleteLesson.mutate(lesson.id); }}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        <Button variant="outline" size="sm" onClick={() => addLesson.mutate(mod.id)}>
                          <Plus className="mr-1 h-3 w-3" /> Add Lesson
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            <Button variant="outline" onClick={() => addModule.mutate()}>
              <Plus className="mr-1 h-4 w-4" /> Add Module
            </Button>
          </div>
        </TabsContent>

        {/* Tab 3: Quizzes */}
        <TabsContent value="quizzes">
          <div className="space-y-4">
            {modules.map((mod: any) => {
              const mQuiz = quizzes.find((q: any) => q.module_id === mod.id && !q.is_final);
              return (
                <Card key={mod.id}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{mod.title} Quiz</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => setQuizDialog({
                        id: mQuiz?.id,
                        module_id: mod.id,
                        is_final: false,
                        passing_score: mQuiz?.passing_score ?? 70,
                        questions: mQuiz?.quiz_questions?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ?? [],
                      })}>
                        {mQuiz ? `Edit (${mQuiz.quiz_questions?.length ?? 0} Q)` : "Add Quiz"}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}

            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Final Assessment</CardTitle>
                  {(() => {
                    const finalQuiz = quizzes.find((q: any) => q.is_final);
                    return (
                      <Button size="sm" variant="outline" onClick={() => setQuizDialog({
                        id: finalQuiz?.id,
                        module_id: null,
                        is_final: true,
                        passing_score: finalQuiz?.passing_score ?? 80,
                        questions: finalQuiz?.quiz_questions?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ?? [],
                      })}>
                        {finalQuiz ? `Edit (${finalQuiz.quiz_questions?.length ?? 0} Q)` : "Add Final Assessment"}
                      </Button>
                    );
                  })()}
                </div>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Preview */}
        <TabsContent value="preview">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-6">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Student Preview</h2>
              </div>
              {modules.map((mod: any) => {
                const modLessons = lessons.filter(l => l.module_id === mod.id);
                return (
                  <div key={mod.id} className="mb-8">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{mod.title}</h3>
                    {modLessons.map((lesson: any) => (
                      <div key={lesson.id} className="mb-6 pl-4 border-l-2 border-border">
                        <h4 className="font-medium text-foreground mb-2">{lesson.title}</h4>
                        <RichTextRenderer content={lesson.content} />
                      </div>
                    ))}
                    {(() => {
                      const mQuiz = quizzes.find((q: any) => q.module_id === mod.id && !q.is_final);
                      if (!mQuiz?.quiz_questions?.length) return null;
                      return (
                        <div className="pl-4 border-l-2 border-accent/50 mt-4">
                          <h4 className="font-medium text-accent mb-2">Module Quiz ({mQuiz.quiz_questions.length} questions, {mQuiz.passing_score}% to pass)</h4>
                          {mQuiz.quiz_questions.map((q: any, i: number) => (
                            <div key={q.id} className="text-sm text-muted-foreground mb-1">
                              {i + 1}. {q.question}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lesson Edit Dialog */}
      <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Lesson</DialogTitle></DialogHeader>
          {editingLesson && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Title</Label><Input value={editingLesson.title} onChange={e => setEditingLesson({ ...editingLesson, title: e.target.value })} /></div>
                <div><Label>Sort Order</Label><Input type="number" value={editingLesson.sort_order ?? 0} onChange={e => setEditingLesson({ ...editingLesson, sort_order: Number(e.target.value) })} /></div>
              </div>
              <div>
                <Label>Content</Label>
                <RichTextEditor content={editingLesson.content} onChange={html => setEditingLesson({ ...editingLesson, content: html })} />
              </div>
              <Button className="w-full" onClick={() => saveLesson.mutate(editingLesson)} disabled={saveLesson.isPending}>
                {saveLesson.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                Save Lesson
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz Edit Dialog */}
      <QuizEditDialog quiz={quizDialog} onClose={() => setQuizDialog(null)} onSave={(q: any) => saveQuiz.mutate(q)} />
    </div>
  );
}

function QuizEditDialog({ quiz, onClose, onSave }: { quiz: any; onClose: () => void; onSave: (q: any) => void }) {
  const [localQuiz, setLocalQuiz] = useState<any>(null);

  if (quiz && !localQuiz) {
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
            <div><Label>Passing Score (%)</Label><Input type="number" value={localQuiz.passing_score} onChange={e => setLocalQuiz({ ...localQuiz, passing_score: Number(e.target.value) })} /></div>
            <div className="space-y-3">
              {questions.map((q: any, i: number) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Question {i + 1}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeQuestion(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                  <Input placeholder="Question text" value={q.question} onChange={e => updateQ(i, "question", e.target.value)} />
                  {[0, 1, 2, 3].map(oi => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${i}`} checked={q.correct_index === oi} onChange={() => updateQ(i, "correct_index", oi)} />
                      <Input placeholder={`Option ${oi + 1}`} value={q.options[oi] ?? ""} onChange={e => updateOption(i, oi, e.target.value)} className="flex-1" />
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
