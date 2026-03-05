import { useParams } from "react-router-dom";
import { CheckCircle, Award } from "lucide-react";

export default function VerifyCertificate() {
  const { id } = useParams();

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-card text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-blue-light">
          <Award className="h-8 w-8 text-accent-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Certificate Verification</h1>
        <p className="text-sm text-muted-foreground mb-4">Verification ID: {id}</p>
        <div className="rounded-lg bg-primary/10 p-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium text-sm">Certificate data will load from the database once connected.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
