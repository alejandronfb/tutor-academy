import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, Paintbrush } from "lucide-react";
import { toast } from "sonner";

export default function AdminTutors() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("full_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: tutors = [] } = useQuery({
    queryKey: ["admin-tutors"],
    queryFn: async () => {
      const { data } = await supabase.from("tutor_profiles").select("*").order("full_name");
      return data ?? [];
    },
  });

  // Fetch content creator role info
  const { data: creatorRoles = [] } = useQuery({
    queryKey: ["admin-creator-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      return (data ?? []).filter((r: any) => r.role === "content_creator");
    },
  });

  const creatorUserIds = new Set(creatorRoles.map((r: any) => r.user_id));

  const { data: tutorDetail } = useQuery({
    queryKey: ["admin-tutor-detail", selectedTutor?.id],
    enabled: !!selectedTutor,
    queryFn: async () => {
      const id = selectedTutor.id;
      const [certs, badges, quizzes, enrollments] = await Promise.all([
        supabase.from("certifications").select("*, courses(title)").eq("tutor_id", id),
        supabase.from("user_badges").select("*, badges(name, icon)").eq("tutor_id", id),
        supabase.from("quiz_attempts").select("*, quizzes(course_id, is_final)").eq("tutor_id", id),
        supabase.from("course_enrollments").select("*, courses(title)").eq("tutor_id", id).not("completed_at", "is", null),
      ]);
      return { certs: certs.data ?? [], badges: badges.data ?? [], quizzes: quizzes.data ?? [], enrollments: enrollments.data ?? [] };
    },
  });

  const updateLevel = useMutation({
    mutationFn: async ({ id, level }: { id: string; level: number }) => {
      const { error } = await supabase.from("tutor_profiles").update({ tutor_level: level }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-tutors"] }); toast.success("Level updated"); },
  });

  const toggleCreatorRole = useMutation({
    mutationFn: async ({ userId, grant }: { userId: string; grant: boolean }) => {
      if (grant) {
        const { error } = await (supabase.from("user_roles") as any).insert({ user_id: userId, role: "content_creator" });
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("user_roles") as any).delete().eq("user_id", userId).eq("role", "content_creator");
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-creator-roles"] });
      toast.success("Role updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSort = (field: string) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const filtered = tutors
    .filter((t: any) => t.full_name?.toLowerCase().includes(search.toLowerCase()) || t.country?.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => {
      const va = a[sortField] ?? "";
      const vb = b[sortField] ?? "";
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">{children}<ArrowUpDown className="h-3 w-3" /></div>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Manage Tutors</h1>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or country..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader field="full_name">Name</SortHeader>
                <SortHeader field="country">Country</SortHeader>
                <TableHead>Specializations</TableHead>
                <SortHeader field="tutor_level">Level</SortHeader>
                <SortHeader field="learning_streak">Streak</SortHeader>
                <TableHead>Role</TableHead>
                <SortHeader field="created_at">Joined</SortHeader>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t: any) => {
                const isCreator = creatorUserIds.has(t.id);
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.full_name}</span>
                        {isCreator && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Paintbrush className="h-3 w-3" /> Creator
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{t.country ?? "–"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(t.specializations ?? []).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={String(t.tutor_level ?? 1)} onValueChange={(v) => updateLevel.mutate({ id: t.id, level: Number(v) })}>
                        <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5].map(l => <SelectItem key={l} value={String(l)}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{t.learning_streak ?? 0}🔥</TableCell>
                    <TableCell>
                      <Button
                        variant={isCreator ? "destructive" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => toggleCreatorRole.mutate({ userId: t.id, grant: !isCreator })}
                      >
                        {isCreator ? "Remove Creator" : "Make Creator"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "–"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTutor(t)}>View</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No tutors found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTutor} onOpenChange={() => setSelectedTutor(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedTutor?.full_name}</DialogTitle></DialogHeader>
          {selectedTutor && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Country:</span> {selectedTutor.country ?? "–"}</div>
                <div><span className="text-muted-foreground">Level:</span> {selectedTutor.tutor_level}</div>
                <div><span className="text-muted-foreground">Experience:</span> {selectedTutor.years_experience ?? "–"}</div>
                <div><span className="text-muted-foreground">English:</span> {selectedTutor.english_level ?? "–"}</div>
                <div><span className="text-muted-foreground">Modality:</span> {selectedTutor.teaching_modality ?? "–"}</div>
                <div><span className="text-muted-foreground">Streak:</span> {selectedTutor.learning_streak ?? 0}🔥</div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Courses Completed ({tutorDetail?.enrollments.length ?? 0})</h4>
                {tutorDetail?.enrollments.map((e: any) => <Badge key={e.id} variant="outline" className="mr-1 mb-1">{e.courses?.title}</Badge>)}
              </div>
              <div>
                <h4 className="font-semibold mb-1">Certifications ({tutorDetail?.certs.length ?? 0})</h4>
                {tutorDetail?.certs.map((c: any) => <Badge key={c.id} className="mr-1 mb-1">{c.title}</Badge>)}
              </div>
              <div>
                <h4 className="font-semibold mb-1">Badges ({tutorDetail?.badges.length ?? 0})</h4>
                {tutorDetail?.badges.map((b: any) => <span key={b.id} className="mr-2">{b.badges?.icon} {b.badges?.name}</span>)}
              </div>
              <div>
                <h4 className="font-semibold mb-1">Quiz Scores</h4>
                {tutorDetail?.quizzes.length === 0 && <span className="text-muted-foreground">No attempts yet</span>}
                {tutorDetail?.quizzes.map((q: any) => (
                  <div key={q.id} className="flex justify-between">
                    <span>{q.quizzes?.is_final ? "Final" : "Module"} Quiz</span>
                    <span className={q.passed ? "text-primary" : "text-destructive"}>{q.score}% {q.passed ? "✓" : "✗"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
