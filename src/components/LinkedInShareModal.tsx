import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { trackEvent } from "@/lib/trackEvent";

interface LinkedInShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cert: {
    title: string;
    issued_at: string;
    verification_id: string;
  };
}

export default function LinkedInShareModal({ open, onOpenChange, cert }: LinkedInShareModalProps) {
  const verifyUrl = `${window.location.origin}/verify/${cert.verification_id}`;
  const issuedDate = new Date(cert.issued_at);
  const fields = [
    { label: "Certification Name", value: cert.title },
    { label: "Issuing Organization", value: "LatinHire Tutor Academy" },
    { label: "Issue Date", value: format(issuedDate, "MMMM d, yyyy") },
    { label: "Credential ID", value: cert.verification_id },
    { label: "Credential URL", value: verifyUrl },
  ];

  const copyField = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.title)}&organizationName=${encodeURIComponent("LatinHire Tutor Academy")}&issueYear=${issuedDate.getFullYear()}&issueMonth=${issuedDate.getMonth() + 1}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(cert.verification_id)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add this credential to LinkedIn</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="text-sm font-medium text-foreground truncate">{f.value}</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0" onClick={() => copyField(f.value, f.label)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">To add this credential to your LinkedIn profile:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs">
            <li>Go to your LinkedIn profile</li>
            <li>Click 'Add profile section' → 'Licenses & certifications'</li>
            <li>Paste the details above</li>
            <li>Save</li>
          </ol>
        </div>
        <Button className="w-full" onClick={() => {
          trackEvent("certificate_shared", { method: "linkedin_direct", cert_id: cert.verification_id });
          window.open(linkedInUrl, "_blank", "noopener,noreferrer");
        }}>
          <ExternalLink className="mr-2 h-4 w-4" /> Open LinkedIn Add Certification
        </Button>
      </DialogContent>
    </Dialog>
  );
}
