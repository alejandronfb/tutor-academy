import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { trackEvent } from "@/lib/trackEvent";

interface CVShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cert: {
    title: string;
    issued_at: string;
    verification_id: string;
  };
}

export default function CVShareModal({ open, onOpenChange, cert }: CVShareModalProps) {
  const verifyUrl = `${window.location.origin}/verify/${cert.verification_id}`;
  const cvText = `${cert.title}\nLatinHire Tutor Academy | ${format(new Date(cert.issued_at), "MMMM yyyy")}\nCredential ID: ${cert.verification_id}\nVerify: ${verifyUrl}`;

  const copyText = () => {
    navigator.clipboard.writeText(cvText);
    toast.success("CV credential block copied");
    trackEvent("certificate_shared", { method: "cv_copy", cert_id: cert.verification_id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Use on CV</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border bg-muted p-4 font-mono text-sm whitespace-pre-wrap text-foreground">
          {cvText}
        </div>
        <p className="text-sm text-muted-foreground">Copy this block and paste it into your CV's certifications section.</p>
        <Button className="w-full" onClick={copyText}>
          <Copy className="mr-2 h-4 w-4" /> Copy for CV
        </Button>
      </DialogContent>
    </Dialog>
  );
}
