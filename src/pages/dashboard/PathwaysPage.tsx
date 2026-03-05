import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PATHWAYS_DATA = [
  {
    id: "core",
    name: "Core Path",
    icon: "🎓",
    description: "Essential skills every professional tutor should develop",
    required: true,
    courses: [
      { id: "foundations", title: "LatinHire Tutor Foundations", certificate: "LatinHire Certified Professional Tutor" },
    ],
  },
  {
    id: "english",
    name: "English Tutor Path",
    icon: "💬",
    description: "Specialized techniques for teaching English conversation and to young learners",
    courses: [
      { id: "english-conversation", title: "Teaching English Conversation", certificate: "English Conversation Specialist" },
      { id: "kids-teens", title: "Teaching Kids & Teens Online", certificate: "Kids Teaching Specialist" },
    ],
  },
  {
    id: "stem",
    name: "STEM Tutor Path",
    icon: "🔬",
    description: "Methods for teaching math, science, and analytical subjects effectively",
    courses: [
      { id: "stem", title: "STEM Tutoring Mastery", certificate: "STEM Teaching Specialist" },
    ],
  },
  {
    id: "writing",
    name: "Writing Tutor Path",
    icon: "✍️",
    description: "Skills for guiding students through academic and creative writing",
    courses: [
      { id: "writing", title: "Writing Tutor Excellence", certificate: "Writing Tutor Specialist" },
    ],
  },
  {
    id: "modality",
    name: "Modality-Specific",
    icon: "📹",
    description: "Master the unique skills required for your preferred teaching format",
    courses: [
      { id: "video", title: "Video Tutoring Mastery", certificate: "Video Tutoring Specialist" },
      { id: "chat", title: "Chat Tutoring Mastery", certificate: "Chat Tutoring Specialist" },
    ],
  },
];

export default function PathwaysPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Learning Paths</h1>
        <p className="text-sm text-muted-foreground mt-1">Structured pathways to develop your teaching expertise</p>
      </div>

      {/* Visual roadmap */}
      <div className="space-y-6">
        {PATHWAYS_DATA.map((pathway, pi) => (
          <div key={pathway.id} className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                {pathway.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-foreground">{pathway.name}</h2>
                  {pathway.required && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Recommended First</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">{pathway.description}</p>

                {/* Course nodes */}
                <div className="flex flex-wrap gap-3">
                  {pathway.courses.map((course, ci) => (
                    <div key={course.id} className="flex items-center gap-2">
                      {ci > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                      <Link
                        to={`/dashboard/courses/${course.id}`}
                        className="rounded-lg border bg-background p-3 hover:border-primary/30 hover:shadow-card-hover transition-all group"
                      >
                        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{course.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">→ {course.certificate}</div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Level progression */}
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Tutor Level Progression</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { level: 1, name: "Certified Tutor", req: "Complete Foundations course", color: "bg-muted" },
            { level: 2, name: "Advanced Tutor", req: "+2 specialization courses + 1 modality course", color: "bg-primary/10" },
            { level: 3, name: "Expert Tutor", req: "All courses in primary pathway + proficiency test", color: "bg-primary/10" },
            { level: 4, name: "Master Tutor", req: "All certifications + 500 hours logged", color: "gradient-navy" },
          ].map((level, i) => (
            <div key={level.level} className={`rounded-xl p-4 ${level.level === 4 ? "gradient-navy" : "border"}`}>
              <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${level.level === 4 ? "text-accent" : "text-muted-foreground"}`}>
                Level {level.level}
              </div>
              <div className={`font-semibold mb-1 ${level.level === 4 ? "text-primary-foreground" : "text-foreground"}`}>{level.name}</div>
              <div className={`text-xs ${level.level === 4 ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{level.req}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
