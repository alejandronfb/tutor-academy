import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { Shield } from "lucide-react";

export default function TutorPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== id) return { authorized: false };
      return { authorized: true };
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.authorized) {
      navigate("/dashboard/profile", { replace: true });
    }
  }, [data, navigate]);

  if (isLoading) {
    return (
      <div className="container py-12 max-w-2xl animate-fade-in">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-2xl animate-fade-in">
      <div className="rounded-xl border bg-card p-8 shadow-card text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">This page is not available</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Tutor profiles are private and not publicly accessible.
        </p>
      </div>
    </div>
  );
}
