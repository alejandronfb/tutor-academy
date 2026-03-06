import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, MapPin, Clock, BookOpen, Trophy } from "lucide-react";
import { useEffect } from "react";
import { format } from "date-fns";

export default function TutorPublicProfile() {
  const { id } = useParams();

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["tutor-public", id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("tutor_profiles")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (!profile) return null;

      const [certsRes, badgesRes] = await Promise.all([
        supabase.from("certifications").select("*, courses(title, icon)").eq("tutor_id", id!),
        supabase.from("user_badges").select("*, badges(*)").eq("tutor_id", id!),
      ]);

      return {
        profile,
        certs: certsRes.data || [],
        badges: badgesRes.data || [],
      };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container py-12 max-w-2xl animate-fade-in">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-12 max-w-2xl animate-fade-in">
        <div className="rounded-xl border bg-card p-8 shadow-card text-center">
          <h1 className="text-2xl font-bold text-foreground">Profile not found</h1>
          <p className="text-sm text-muted-foreground mt-2">This tutor profile does not exist.</p>
        </div>
      </div>
    );
  }

  const { profile, certs, badges } = data;

  return (
    <div className="container py-12 max-w-2xl animate-fade-in">
      <div className="rounded-xl border bg-card p-8 shadow-card">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-navy text-2xl font-bold text-primary-foreground">
            {profile.full_name?.charAt(0)?.toUpperCase() || "T"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {profile.country && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.country}</span>
              )}
              <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> Level {profile.tutor_level || 1}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid gap-3 sm:grid-cols-2 mb-6">
          {profile.teaching_modality && (
            <div className="text-sm"><span className="font-medium text-foreground">Modality:</span> <span className="text-muted-foreground">{profile.teaching_modality}</span></div>
          )}
          {profile.years_experience && (
            <div className="text-sm"><span className="font-medium text-foreground">Experience:</span> <span className="text-muted-foreground">{profile.years_experience}</span></div>
          )}
          {profile.specializations && profile.specializations.length > 0 && (
            <div className="text-sm sm:col-span-2">
              <span className="font-medium text-foreground">Specializations:</span>{" "}
              <span className="text-muted-foreground">{profile.specializations.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Certifications */}
        {certs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Certifications
            </h2>
            <div className="space-y-2">
              {certs.map((cert: any) => (
                <div key={cert.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="text-lg">{cert.courses?.icon || "📜"}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{cert.title}</p>
                    <p className="text-xs text-muted-foreground">Issued {format(new Date(cert.issued_at), "MMM d, yyyy")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" /> Badges
            </h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((ub: any) => (
                <span key={ub.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                  {ub.badges?.icon || "🏅"} {ub.badges?.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Member since */}
        {profile.created_at && (
          <p className="text-xs text-muted-foreground mt-4">
            Member since {format(new Date(profile.created_at), "MMMM yyyy")}
          </p>
        )}
      </div>
    </div>
  );
}
