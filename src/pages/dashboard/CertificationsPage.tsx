import { Award, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CertificationsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Certifications</h1>
        <p className="text-sm text-muted-foreground mt-1">Professional credentials you've earned</p>
      </div>

      {/* Available certificates */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Certifications</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: "LatinHire Certified Professional Tutor", course: "LatinHire Tutor Foundations", icon: "🎓" },
            { title: "English Conversation Specialist", course: "Teaching English Conversation", icon: "💬" },
            { title: "Kids Teaching Specialist", course: "Teaching Kids & Teens Online", icon: "👶" },
            { title: "STEM Teaching Specialist", course: "STEM Tutoring Mastery", icon: "🔬" },
            { title: "Writing Tutor Specialist", course: "Writing Tutor Excellence", icon: "✍️" },
            { title: "Video Tutoring Specialist", course: "Video Tutoring Mastery", icon: "📹" },
            { title: "Chat Tutoring Specialist", course: "Chat Tutoring Mastery", icon: "💬" },
          ].map((cert) => (
            <div key={cert.title} className="rounded-xl border bg-card p-5 shadow-card flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                {cert.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">{cert.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Complete: {cert.course}</p>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Not yet earned</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
