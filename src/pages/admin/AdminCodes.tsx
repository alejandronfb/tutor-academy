import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search, Copy, Layers } from "lucide-react";
import { toast } from "sonner";

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `LH-${rand(4)}-${rand(4)}`;
}

export default function AdminCodes() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "used">("all");
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkQty, setBulkQty] = useState(10);

  const { data: codes = [] } = useQuery({
    queryKey: ["admin-codes"],
    queryFn: async () => {
      const { data } = await supabase.from("invitation_codes").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const generateSingle = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invitation_codes").insert({ code: generateCode() });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-codes"] }); toast.success("Code generated"); },
  });

  const generateBulk = useMutation({
    mutationFn: async (qty: number) => {
      const batch = Array.from({ length: qty }, () => ({ code: generateCode() }));
      const { error } = await supabase.from("invitation_codes").insert(batch);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-codes"] }); setBulkDialog(false); toast.success("Codes generated"); },
  });

  const deactivate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invitation_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-codes"] }); toast.success("Code deactivated"); },
  });

  const filtered = codes.filter((c: any) => {
    const isUsed = !!c.used_by;
    if (filter === "available" && isUsed) return false;
    if (filter === "used" && !isUsed) return false;
    if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Invitation Codes</h1>
        <div className="flex gap-2">
          <Button onClick={() => generateSingle.mutate()}><Plus className="mr-1 h-4 w-4" /> Generate Code</Button>
          <Button variant="outline" onClick={() => setBulkDialog(true)}><Layers className="mr-1 h-4 w-4" /> Generate Bulk</Button>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search codes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {(["all", "available", "used"] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Used At</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center gap-2">
                      {c.code}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied"); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.used_by ? "secondary" : "default"}>{c.used_by ? "Used" : "Available"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.used_at ? new Date(c.used_at).toLocaleString() : "–"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {!c.used_by && (
                      <Button variant="ghost" size="sm" onClick={() => deactivate.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No codes found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Bulk Codes</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Quantity (1-100)</Label><Input type="number" min={1} max={100} value={bulkQty} onChange={(e) => setBulkQty(Math.min(100, Math.max(1, Number(e.target.value))))} /></div>
            <Button className="w-full" onClick={() => generateBulk.mutate(bulkQty)}>Generate {bulkQty} Codes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
