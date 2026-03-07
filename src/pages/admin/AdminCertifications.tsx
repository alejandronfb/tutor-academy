import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminCertifications() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [tutorSearch, setTutorSearch] = useState("");
  const [selectedTutor, setSelectedTutor] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [certTitle, setCertTitle] = useState("");

  const { data: certs = [] } = useQuery({
    queryKey: ["admin-certs"],
    queryFn: async () => {
      const { data } = await supabase.from("certifications").select("*, courses(title)").order("issued_at", { ascending: false });
      // Get tutor names
      const tutorIds = [...new Set((data ?? []).map((c: any) => c.tutor_id))];
      const { data: profiles } = await supabase.from("tutor_profiles").select("id, full_name").in("id", tutorIds);
      const nameMap: Record<string, string> = {};
      (profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name; });
      return (data ?? []).map((c: any) => ({ ...c, tutorName: nameMap[c.tutor_id] ?? "Unknown" }));
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["admin-cert-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, title, certificate_title");
      return data ?? [];
    },
  });

  const { data: tutors = [] } = useQuery({
    queryKey: ["admin-cert-tutors", tutorSearch],
    enabled: dialog && tutorSearch.length >= 2,
    queryFn: async () => {
      const { data } = await supabase.from("tutor_profiles").select("id, full_name").ilike("full_name", `%${tutorSearch}%`).limit(10);
      return data ?? [];
    },
  });

  const issueCert = useMutation({
    mutationFn: async () => {
      if (!selectedTutor || !selectedCourse || !certTitle) throw new Error("Fill all fields");
      const { error } = await supabase.from("certifications").insert({ tutor_id: selectedTutor, course_id: selectedCourse, title: certTitle });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certs"] });
      setDialog(false);
      setSelectedTutor("");
      setSelectedCourse("");
      setCertTitle("");
      setTutorSearch("");
      toast.success("Certificate issued");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Certifications</h1>
        <Button onClick={() => setDialog(true)}><Plus className="mr-1 h-4 w-4" /> Issue Certificate</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tutor</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Verification ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certs.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.tutorName}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell className="text-muted-foreground">{c.courses?.title ?? "–"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.issued_at ? new Date(c.issued_at).toLocaleDateString() : "–"}</TableCell>
                  <TableCell className="font-mono text-xs">{c.verification_id}</TableCell>
                </TableRow>
              ))}
              {certs.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No certifications issued yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Certificate</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Search Tutor</Label>
              <Input placeholder="Type tutor name..." value={tutorSearch} onChange={(e) => setTutorSearch(e.target.value)} />
              {tutors.length > 0 && (
                <div className="border rounded-md mt-1 max-h-32 overflow-y-auto">
                  {tutors.map((t: any) => (
                    <div key={t.id} className={`px-3 py-2 cursor-pointer hover:bg-muted text-sm ${selectedTutor === t.id ? "bg-primary/10 font-medium" : ""}`} onClick={() => { setSelectedTutor(t.id); setTutorSearch(t.full_name); }}>
                      {t.full_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Course</Label>
              <Select value={selectedCourse} onValueChange={(v) => {
                setSelectedCourse(v);
                const course = courses.find((c: any) => c.id === v);
                if (course?.certificate_title) setCertTitle(course.certificate_title);
              }}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Certificate Title</Label><Input value={certTitle} onChange={(e) => setCertTitle(e.target.value)} /></div>
            <Button className="w-full" onClick={() => issueCert.mutate()} disabled={!selectedTutor || !selectedCourse || !certTitle}>Issue Certificate</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
