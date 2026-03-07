import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Award, XCircle, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function VerifyCertificate() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["verify-cert", id],
    queryFn: async () => {
      const { data: cert } = await (supabase
        .from("certifications") as any)
        .select("*, courses(title, icon, certification_type, certification_validity_months)")
        .eq("verification_id", id!)
        .maybeSingle();
      if (!cert) return null;

      const { data: profile } = await supabase
        .from("tutor_profiles")
        .select("full_name")
        .eq("id", cert.tutor_id)
        .maybeSingle();

      const expired = cert.expires_at && new Date(cert.expires_at) < new Date();

      return { ...cert, tutorName: profile?.full_name || "Certificate Holder", expired };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <Skeleton className="w-full max-w-md h-64 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-card text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Credential Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This verification ID does not match any issued credential.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-card text-center">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${data.expired ? "bg-amber-100 dark:bg-amber-950/30" : "bg-emerald-100 dark:bg-emerald-950/30"}`}>
          {data.expired ? <AlertTriangle className="h-8 w-8 text-amber-600" /> : <Award className="h-8 w-8 text-emerald-600" />}
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">
          {data.expired ? "Credential Expired" : "Credential Verified"}
        </h1>
        <div className={`rounded-lg p-4 mb-4 ${data.expired ? "bg-amber-50 dark:bg-amber-950/20" : "bg-emerald-50 dark:bg-emerald-950/20"}`}>
          <div className={`flex items-center justify-center gap-2 mb-2 ${data.expired ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
            {data.expired ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
            <span className="font-semibold text-sm">{data.expired ? "This credential has expired" : "Valid"}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          This is a {data.expired ? "previously " : ""}verified credential issued by LatinHire Tutor Academy.
        </p>
        <div className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">Credential:</span> <span className="font-medium text-foreground">{data.title}</span></div>
          <div><span className="text-muted-foreground">Recipient:</span> <span className="font-medium text-foreground">{data.tutorName}</span></div>
          <div><span className="text-muted-foreground">Issuer:</span> <span className="font-medium text-foreground">LatinHire Tutor Academy</span></div>
          <div><span className="text-muted-foreground">Issued:</span> <span className="font-medium text-foreground">{format(new Date(data.issued_at), "MMMM d, yyyy")}</span></div>
          <div><span className="text-muted-foreground">Credential ID:</span> <span className="font-mono text-xs text-foreground">{data.verification_id}</span></div>
          <div>
            <span className="text-muted-foreground">Status:</span>{" "}
            <span className={`font-medium ${data.expired ? "text-amber-600" : "text-emerald-600"}`}>
              {data.expired ? "Expired" : "Active"}
            </span>
          </div>
          {data.expires_at && !data.expired && (
            <div><span className="text-muted-foreground">Valid Until:</span> <span className="font-medium text-foreground">{format(new Date(data.expires_at), "MMMM d, yyyy")}</span></div>
          )}
        </div>
      </div>
    </div>
  );
}
