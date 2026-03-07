import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Plus, Loader2, Users, Activity } from "lucide-react";
import { toast } from "sonner";

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const last12Months = () => {
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
};

export default function AdminActivity() {
  const queryClient = useQueryClient();
  const [selectedTutor, setSelectedTutor] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [hours, setHours] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");

  const { data: tutors = [] } = useQuery({
    queryKey: ["admin-tutors-list"],
    queryFn: async () => {
      const { data } = await supabase.from("tutor_profiles").select("id, full_name").order("full_name");
      return data || [];
    },
  });

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["admin-activity", filterMonth],
    queryFn: async () => {
      let query = (supabase.from("tutor_activity_monthly") as any).select("*").order("month", { ascending: false });
      if (filterMonth !== "all") query = query.eq("month", filterMonth);
      const { data } = await query.limit(200);
      return (data || []) as any[];
    },
  });

  const { data: statusSummary } = useQuery({
    queryKey: ["admin-activity-summary"],
    queryFn: async () => {
      const tutorIds = tutors.map(t => t.id);
      let active = 0, recentlyActive = 0, inactive = 0;
      // Use the function for each tutor
      for (const tid of tutorIds) {
        const { data } = await supabase.rpc("get_activity_status", { p_tutor_id: tid });
        if (data === "active") active++;
        else if (data === "recently_active") recentlyActive++;
        else inactive++;
      }
      return { active, recentlyActive, inactive };
    },
    enabled: tutors.length > 0,
  });

  const addActivity = useMutation({
    mutationFn: async () => {
      if (!selectedTutor || !selectedMonth || !hours) throw new Error("Fill all fields");
      const { error } = await (supabase.from("tutor_activity_monthly") as any).upsert({
        tutor_id: selectedTutor,
        month: selectedMonth,
        hours_worked: Number(hours),
        source: "manual",
      }, { onConflict: "tutor_id,month" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Activity recorded");
      setHours("");
      queryClient.invalidateQueries({ queryKey: ["admin-activity"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity-summary"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.trim().split("\n").slice(1); // skip header
    let success = 0, errors = 0;

    // Build email → tutor_id map
    const { data: profiles } = await supabase.from("tutor_profiles").select("id, full_name");
    // We need emails from auth but can't access that. Match by name instead or use id directly.
    // CSV format: tutor_id, month, hours_worked
    for (const line of lines) {
      const [tutorId, month, hoursStr] = line.split(",").map(s => s.trim());
      if (!tutorId || !month || !hoursStr) { errors++; continue; }
      const { error } = await (supabase.from("tutor_activity_monthly") as any).upsert({
        tutor_id: tutorId,
        month,
        hours_worked: Number(hoursStr),
        source: "csv",
      }, { onConflict: "tutor_id,month" });
      if (error) errors++;
      else success++;
    }

    toast.success(`CSV imported: ${success} records saved, ${errors} errors`);
    queryClient.invalidateQueries({ queryKey: ["admin-activity"] });
    queryClient.invalidateQueries({ queryKey: ["admin-activity-summary"] });
    e.target.value = "";
  };

  const tutorNameMap = Object.fromEntries(tutors.map(t => [t.id, t.full_name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Tutor Activity</h1>

      {/* Status Summary */}
      {statusSummary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <Activity className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{statusSummary.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recently Active</span>
                <Activity className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{statusSummary.recentlyActive}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inactive</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{statusSummary.inactive}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Update */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Record Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="min-w-[200px]">
              <Label>Tutor</Label>
              <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                <SelectTrigger><SelectValue placeholder="Select tutor" /></SelectTrigger>
                <SelectContent>
                  {tutors.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {last12Months().map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hours Worked</Label>
              <Input type="number" value={hours} onChange={e => setHours(e.target.value)} className="w-[100px]" />
            </div>
            <Button onClick={() => addActivity.mutate()} disabled={addActivity.isPending}>
              {addActivity.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CSV Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">CSV Import</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Upload a CSV with columns: <code>tutor_id, month, hours_worked</code></p>
          <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border bg-background px-4 py-2 text-sm hover:bg-muted transition-colors">
            <Upload className="h-4 w-4" />
            Upload CSV
            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
          </label>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Activity Records</CardTitle>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Filter month" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {last12Months().map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : activities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{tutorNameMap[a.tutor_id] || a.tutor_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm">{a.month}</TableCell>
                    <TableCell className="text-sm">{a.hours_worked}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
