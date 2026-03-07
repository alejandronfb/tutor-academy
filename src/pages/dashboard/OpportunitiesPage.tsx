import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, DollarSign, Video, MessageSquare, MapPin, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function OpportunitiesPage() {
  const [modalityFilter, setModalityFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["opportunities-page"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: opps } = await supabase.from("opportunities").select("*").eq("status", "open").order("created_at", { ascending: false });
      let interests: string[] = [];
      if (user) {
        const { data: int } = await supabase.from("opportunity_interest").select("opportunity_id").eq("tutor_id", user.id);
        if (int) interests = int.map((i) => i.opportunity_id);
      }
      return { opportunities: opps || [], interests, userId: user?.id };
    },
  });

  const indicateReadiness = useMutation({
    mutationFn: async (oppId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("opportunity_interest").insert({ tutor_id: user.id, opportunity_id: oppId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Your readiness has been noted. The LatinHire team may follow up based on your credentials and learning.");
      queryClient.invalidateQueries({ queryKey: ["opportunities-page"] });
    },
    onError: () => toast.error("Could not indicate readiness. Please try again."),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const { opportunities, interests } = data!;
  const filtered = opportunities.filter((o: any) => modalityFilter === "all" || o.modality === modalityFilter);
  const selectedOpp = opportunities.find((o: any) => o.id === selected);
  const hasInterest = (id: string) => interests.includes(id);

  if (selectedOpp) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>← Back to Advanced Eligibility</Button>
        <div className="rounded-xl border bg-card p-6 md:p-8 shadow-card">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Open</span>
          <h1 className="text-2xl font-bold text-foreground mt-2 mb-2">{selectedOpp.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{selectedOpp.client}</p>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" /> {selectedOpp.pay_rate}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">{selectedOpp.modality === "Video" ? <Video className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />} {selectedOpp.modality}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {selectedOpp.hours_per_week} hrs/week</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {selectedOpp.schedule}</div>
          </div>
          <h3 className="font-semibold text-foreground mb-2">Description</h3>
          <p className="text-sm text-muted-foreground mb-4">{selectedOpp.description}</p>
          <h3 className="font-semibold text-foreground mb-2">Qualifications</h3>
          <p className="text-sm text-muted-foreground mb-6">{selectedOpp.requirements}</p>
          {hasInterest(selectedOpp.id) ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle className="h-4 w-4" /> Readiness Indicated</span>
          ) : (
            <Button onClick={() => indicateReadiness.mutate(selectedOpp.id)} disabled={indicateReadiness.isPending}>
              <CheckCircle className="mr-2 h-4 w-4" /> Indicate Readiness
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-2">Your readiness has been noted. The LatinHire team may follow up based on your credentials and learning.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Advanced Eligibility</h1>
        <p className="text-sm text-muted-foreground mt-1">Learning and credentials that may support additional opportunities</p>
      </div>
      <div className="flex gap-3">
        <Select value={modalityFilter} onValueChange={setModalityFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Modality" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modalities</SelectItem>
            <SelectItem value="Video">Video</SelectItem>
            <SelectItem value="Chat">Chat</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-muted-foreground">No advanced opportunities at this time. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((opp: any) => (
            <div key={opp.id} className="rounded-xl border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => setSelected(opp.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{opp.title}</h3>
                    {hasInterest(opp.id) ? (
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">Ready</span>
                    ) : (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Open</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{opp.client}</p>
                </div>
                <span className="font-semibold text-primary text-sm">{opp.pay_rate}</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">{opp.modality === "Video" ? <Video className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />} {opp.modality}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {opp.hours_per_week} hrs/week</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {opp.schedule}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
