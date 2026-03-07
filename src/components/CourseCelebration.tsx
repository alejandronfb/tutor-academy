import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Clipboard, Award, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { generateCertificatePdf } from "@/lib/generateCertificatePdf";
import LinkedInShareModal from "./LinkedInShareModal";
import { trackEvent } from "@/lib/trackEvent";

interface CourseCelebrationProps {
  certTitle: string;
  tutorName: string;
  issuedAt: string;
  verificationId: string;
  template?: string;
  badgeName?: string;
  badgeIcon?: string;
  nextCourseSlug?: string;
  nextCourseTitle?: string;
  onClose: () => void;
}

export default function CourseCelebration({
  certTitle, tutorName, issuedAt, verificationId, template,
  badgeName, badgeIcon, nextCourseSlug, nextCourseTitle, onClose,
}: CourseCelebrationProps) {
  const [showLinkedIn, setShowLinkedIn] = useState(false);

  const cert = { title: certTitle, issued_at: issuedAt, verification_id: verificationId };

  return (
    <div className="text-center py-8 space-y-6 animate-fade-in">
      <div className="text-6xl">🎉</div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Congratulations! You earned:</h2>
        <p className="text-xl font-semibold text-primary mt-2">{certTitle}</p>
      </div>

      {badgeName && (
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
          <span className="text-lg">{badgeIcon || "🏅"}</span>
          <span className="text-sm font-medium text-primary">{badgeName}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Button variant="outline" size="sm" onClick={() => {
          trackEvent("certificate_downloaded", { cert_id: verificationId });
          generateCertificatePdf({
            tutorName, certTitle, verificationId, template: (template as any) || "classic",
            issuedAt: format(new Date(issuedAt), "MMMM d, yyyy"),
          });
        }}>
          <Download className="mr-1 h-4 w-4" /> Download Certificate
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowLinkedIn(true)}>
          <Clipboard className="mr-1 h-4 w-4" /> Copy for LinkedIn
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/certifications">
            <Award className="mr-1 h-4 w-4" /> View in My Credentials
          </Link>
        </Button>
        {nextCourseSlug && (
          <Button size="sm" asChild>
            <Link to={`/dashboard/courses/${nextCourseSlug}`}>
              Continue to Next Course <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <Button variant="ghost" size="sm" onClick={onClose}>Back to Course</Button>

      <LinkedInShareModal open={showLinkedIn} onOpenChange={setShowLinkedIn} cert={cert} />
    </div>
  );
}
