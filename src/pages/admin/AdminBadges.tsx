import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminBadges() {
  const queryClient = useQueryClient();
  const [awardDialog, setAwardDialog] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState("");
  const [tutorSearch, setTutorSearch] = useState("");
  const [selectedTutor, setSelectedTutor] = useState("");

  const { data: badges = [] } = useQuery({
    queryKey: ["admin-badges"],
    queryFn: async () => {
      const { data } = await supabase.from("badges").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: tutors = [] } = useQuery({
    queryKey: ["admin-badge-tutors", tutorSearch],
    enabled: awardDialog && tutorSearch.length >= 2,
    queryFn: async () => {
      const { data } = await supabase.from("tutor_profiles").select("id, full_name").ilike("full_name", `%${tutorSearch}%`).limit(10);
      return data ?? [];
    },
  });

  const awardBadge = useMutation({
    mutationFn: async () => {
      if (!selectedTutor || !selectedBadge) throw new Error("Select both tutor and badge");
      // Check if already awarded
      const { data: existing } = await supabase.from("user_badges").select("id").eq("tutor_id", selectedTutor).eq("badge_id", selectedBadge).maybeSingle();
      if (existing) throw new Error("Badge already awarded to this tutor");
      const { error } = await supabase.from("user_badges").insert({ tutor_id: selectedTutor, badge_id: selectedBadge });
      if (error) throw error;
    },
    onSuccess: () => { setAwardDialog(false); setSelectedBadge(""); setSelectedTutor(""); setTutorSearch(""); toast.success("Badge awarded!"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Badge Definitions</h1>
        <Button onClick={() => setAwardDialog(true)}><Award className="mr-1 h-4 w-4" /> Award Badge</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unlock Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xl">{b.icon}</TableCell>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{b.description ?? "–"}</TableCell>
                  <TableCell><Badge variant="outline">{b.unlock_type ?? "–"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={awardDialog} onOpenChange={setAwardDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Award Badge to Tutor</DialogTitle></DialogHeader>
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
              <Label>Badge</Label>
              <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                <SelectTrigger><SelectValue placeholder="Select badge" /></SelectTrigger>
                <SelectContent>
                  {badges.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.icon} {b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => awardBadge.mutate()} disabled={!selectedTutor || !selectedBadge}>Award Badge</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
