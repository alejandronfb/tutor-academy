import { BookOpen, Share2, RefreshCw } from "lucide-react";

const sections = [
  {
    title: "Quick Reference",
    description: "Downloadable checklists and guides coming soon",
    icon: BookOpen,
    status: "coming_soon" as const,
  },
  {
    title: "Credential Sharing Help",
    description: "Learn how to add your credentials to LinkedIn and your CV. Visit your Credentials page to use the sharing tools.",
    icon: Share2,
    status: "available" as const,
    link: "/dashboard/certifications",
  },
  {
    title: "Skill Refreshers",
    description: "Short refresher courses coming soon",
    icon: RefreshCw,
    status: "coming_soon" as const,
  },
];

export default function ResourcesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">Quick references, guides, and tools for your professional practice</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((s) => (
          <div key={s.title} className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{s.description}</p>
            {s.status === "available" ? (
              <a href={s.link} className="text-sm font-medium text-primary hover:underline">Go to Credentials →</a>
            ) : (
              <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Coming Soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
