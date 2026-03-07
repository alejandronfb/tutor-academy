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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, XCircle, Users } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { title: "", client: "", subject: "", pay_rate: "", modality: "", schedule: "", hours_per_week: "", requirements: "", description: "" };

export default function AdminOpportunities() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [interestDialog, setInterestDialog] = useState<any>(null);

  const { data: opportunities = [] } = useQuery({
    queryKey: ["admin-opportunities"],
    queryFn: async () => {
      const { data } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false });
      const { data: interests } = await supabase.from("opportunity_interest").select("opportunity_id");
      const counts: Record<string, number> = {};
      (interests ?? []).forEach((i: any) => { counts[i.opportunity_id] = (counts[i.opportunity_id] ?? 0) + 1; });
      return (data ?? []).map((o: any) => ({ ...o, interestCount: counts[o.id] ?? 0 }));
    },
  });

  const { data: interestedTutors = [] } = useQuery({
    queryKey: ["admin-opp-interest", interestDialog?.id],
    enabled: !!interestDialog,
    queryFn: async () => {
      const { data } = await supabase.from("opportunity_interest").select("*, tutor_profiles(full_name, country, specializations, tutor_level)").eq("opportunity_id", interestDialog.id);
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (values: any) => {
      const { interestCount, ...clean } = values;
      if (editing) {
        const { error } = await supabase.from("opportunities").update(clean).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("opportunities").insert({ ...clean, status: "open" });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-opportunities"] }); setDialog(false); setEditing(null); toast.success("Saved"); },
  });

  const closeOpp = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opportunities").update({ status: "closed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-opportunities"] }); toast.success("Opportunity closed"); },
  });

  const openEdit = (o: any) => { setEditing(o); setForm(o); setDialog(true); };
  const openNew = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const F = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Manage Opportunities</h1>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> New Opportunity</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.title}</TableCell>
                  <TableCell>{o.client ?? "–"}</TableCell>
                  <TableCell>{o.subject ?? "–"}</TableCell>
                  <TableCell><Badge variant={o.status === "open" ? "default" : "secondary"}>{o.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setInterestDialog(o)}>
                      <Users className="mr-1 h-4 w-4" />{o.interestCount}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Edit className="h-4 w-4" /></Button>
                      {o.status === "open" && (
                        <Button variant="ghost" size="icon" onClick={() => closeOpp.mutate(o.id)}><XCircle className="h-4 w-4 text-destructive" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Opportunity" : "New Opportunity"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={F("title")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Client</Label><Input value={form.client ?? ""} onChange={F("client")} /></div>
              <div><Label>Subject</Label><Input value={form.subject ?? ""} onChange={F("subject")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Pay Rate</Label><Input value={form.pay_rate ?? ""} onChange={F("pay_rate")} /></div>
              <div><Label>Modality</Label><Input value={form.modality ?? ""} onChange={F("modality")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Schedule</Label><Input value={form.schedule ?? ""} onChange={F("schedule")} /></div>
              <div><Label>Hours/Week</Label><Input value={form.hours_per_week ?? ""} onChange={F("hours_per_week")} /></div>
            </div>
            <div><Label>Requirements</Label><Textarea value={form.requirements ?? ""} onChange={F("requirements")} /></div>
            <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={F("description")} /></div>
            <Button className="w-full" onClick={() => save.mutate(form)}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!interestDialog} onOpenChange={() => setInterestDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Interested Tutors — {interestDialog?.title}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interestedTutors.map((i: any) => (
                <TableRow key={i.id}>
                  <TableCell>{i.tutor_profiles?.full_name ?? "–"}</TableCell>
                  <TableCell>{i.tutor_profiles?.country ?? "–"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(i.tutor_profiles?.specializations ?? []).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>{i.tutor_profiles?.tutor_level ?? 1}</TableCell>
                  <TableCell><Badge variant="outline">{i.status}</Badge></TableCell>
                </TableRow>
              ))}
              {interestedTutors.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No interested tutors yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
