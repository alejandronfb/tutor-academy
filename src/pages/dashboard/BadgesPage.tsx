import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function BadgesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["badges-page"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: allBadges } = await supabase.from("badges").select("*").order("name");
      const userBadgeIds: string[] = [];
      if (user) {
        const { data: ub } = await supabase.from("user_badges").select("badge_id").eq("tutor_id", user.id);
        if (ub) ub.forEach((b) => userBadgeIds.push(b.badge_id));
      }
      return { badges: allBadges || [], unlockedIds: userBadgeIds };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const { badges, unlockedIds } = data!;
  const earned = badges.filter((b: any) => unlockedIds.includes(b.id));
  const available = badges.filter((b: any) => !unlockedIds.includes(b.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Badges</h1>
        <p className="text-sm text-muted-foreground mt-1">Private achievement milestones in your professional development</p>
        <p className="text-xs text-muted-foreground mt-1">{unlockedIds.length} of {badges.length} earned</p>
      </div>

      {earned.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Earned</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {earned.map((badge: any) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div className="rounded-xl border p-5 text-center bg-card shadow-card">
                    <div className="text-4xl mb-2">{badge.icon || "🏅"}</div>
                    <div className="font-medium text-xs text-foreground">{badge.name}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">✓ Earned! {badge.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Available</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {available.map((badge: any) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div className="rounded-xl border p-5 text-center bg-muted/50 opacity-50 grayscale">
                    <div className="text-4xl mb-2">{badge.icon || "🏅"}</div>
                    <div className="font-medium text-xs text-foreground">{badge.name}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">How to earn: {badge.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
