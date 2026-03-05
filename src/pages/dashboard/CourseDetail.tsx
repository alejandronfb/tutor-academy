import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Award, CheckCircle } from "lucide-react";
import { useState } from "react";

const COURSE_DATA: Record<string, any> = {
  foundations: {
    title: "LatinHire Tutor Foundations",
    icon: "🎓",
    certificate: "LatinHire Certified Professional Tutor",
    duration: "8 hours",
    modules: [
      {
        title: "The LatinHire Standard",
        lessons: [
          { title: "What Clients Expect", content: "# What Clients Expect\n\nWhen working with U.S. tutoring companies through LatinHire, understanding client expectations is essential for building lasting professional relationships.\n\n## Key Expectations\n\n**Punctuality and Reliability**\nClients expect tutors to arrive on time for every session. Being 5 minutes early demonstrates professionalism and allows you to prepare your materials.\n\n**Communication Quality**\nClear, professional communication in English is fundamental. This includes:\n- Using proper grammar in all written communications\n- Speaking clearly and at an appropriate pace\n- Confirming session details in advance\n\n**Subject Matter Expertise**\nClients trust that you have deep knowledge of your teaching subjects. Always be honest about your capabilities and continue developing your expertise.\n\n**Student Progress Tracking**\nMost clients expect regular updates on student progress. Keep notes on each session and be prepared to share insights about student development.\n\n## The Professional Tutor Mindset\n\nThink of yourself as a professional consultant. You bring specialized expertise to each engagement, and your reputation is your most valuable asset." },
          { title: "Building Professional Reputation", content: "# Building Your Professional Reputation\n\nYour reputation as a tutor is built one session at a time. Here are proven strategies for establishing yourself as a top-tier professional.\n\n## Consistency Is Key\n\nThe most successful tutors in the LatinHire network share one trait: consistency. They deliver the same high-quality experience in every session.\n\n## Tips for Reputation Building\n\n1. **Follow up after sessions** — Send a brief summary of what was covered\n2. **Be proactive** — Suggest resources and practice materials\n3. **Seek feedback** — Ask students and coordinators how you can improve\n4. **Stay current** — Keep your subject knowledge fresh and up to date\n5. **Be adaptable** — Each student is unique; adjust your approach accordingly" },
        ],
      },
      {
        title: "Professional Communication",
        lessons: [
          { title: "Email Best Practices", content: "# Professional Email Communication\n\nAs a tutor working with U.S. companies, your email communication reflects your professionalism.\n\n## Email Structure\n\n**Subject Line**: Be clear and specific\n- ✅ \"Session Summary — March 5, 2026 — [Student Name]\"\n- ❌ \"Hello\"\n\n**Opening**: Professional and warm\n- \"Dear [Name],\" or \"Hi [Name],\"\n\n**Body**: Concise and organized\n- Use short paragraphs\n- Include bullet points for clarity\n- State any action items clearly\n\n**Closing**: Professional\n- \"Best regards,\" or \"Thank you,\"\n\n## Response Time\n\nAim to respond to emails within 24 hours. Even if you need more time to address the content, acknowledge receipt promptly." },
          { title: "Session Openings and Follow-ups", content: "# Effective Session Management\n\n## Opening a Session\n\nThe first 2 minutes set the tone for the entire tutoring session.\n\n### The 3-Step Opening\n\n1. **Warm greeting** — \"Hi [Name], great to see you! How's your day going?\"\n2. **Quick review** — \"Last time we worked on [topic]. How did your practice go?\"\n3. **Set agenda** — \"Today we'll cover [objectives]. Does that sound good?\"\n\n## Follow-Up Best Practices\n\nAfter each session, send a brief follow-up within 24 hours:\n\n- Summary of topics covered\n- Any homework or practice suggestions\n- Encouragement and positive reinforcement\n- Preview of next session topics" },
        ],
      },
      {
        title: "Student Engagement",
        lessons: [
          { title: "Keeping Student Attention", content: "# Keeping Students Engaged\n\n## The Attention Challenge\n\nOnline tutoring presents unique engagement challenges. Without physical presence, students can easily lose focus.\n\n## Proven Engagement Techniques\n\n### The 10-Minute Rule\nChange your approach every 10 minutes:\n- Explain a concept (10 min)\n- Practice together (10 min)\n- Independent practice with guidance (10 min)\n\n### Ask Questions Frequently\nDon't lecture for more than 3 minutes without asking a question. Questions:\n- Check understanding\n- Keep students active\n- Build critical thinking\n\n### Use Names\nUsing a student's name increases engagement and creates personal connection.\n\n### Vary Your Energy\nMatch your energy to the student's level, then gently raise it. If a student seems tired, start calm and gradually increase enthusiasm." },
          { title: "Asking Good Questions", content: "# The Art of Asking Questions\n\nGreat tutors ask great questions. Here's how to develop this essential skill.\n\n## Question Types\n\n### Checking Questions\n\"Can you explain back to me what we just discussed?\"\n\n### Probing Questions\n\"Why do you think that's the answer?\" / \"What would happen if...?\"\n\n### Scaffolding Questions\n\"What's the first step we need to take?\" (guiding without giving the answer)\n\n## The Wait Rule\n\nAfter asking a question, **wait at least 5 seconds**. Silence feels uncomfortable, but it gives students time to think. Rushing to fill silence is one of the most common mistakes tutors make.\n\n## Avoid Binary Questions\n\n- ❌ \"Do you understand?\" (students often say yes even when they don't)\n- ✅ \"Can you show me how you'd solve a similar problem?\"" },
        ],
      },
      {
        title: "Feedback Techniques",
        lessons: [
          { title: "Correcting Without Discouraging", content: "# Effective Feedback Strategies\n\nThe way you deliver feedback can make the difference between a student who perseveres and one who gives up.\n\n## The Sandwich Method (Revised)\n\nThe classic feedback sandwich (positive-negative-positive) can feel formulaic. Instead, try:\n\n### The Growth Method\n1. **Acknowledge effort** — \"I can see you worked hard on this.\"\n2. **Identify the strength** — \"Your opening paragraph is strong because...\"\n3. **Guide improvement** — \"One technique that could make this even better is...\"\n4. **Express confidence** — \"You're definitely heading in the right direction.\"\n\n## Key Principles\n\n- **Focus on the work, not the person** — \"This paragraph needs revision\" not \"You wrote this wrong\"\n- **Be specific** — Vague feedback is unhelpful\n- **Make it actionable** — Tell them exactly what to do next\n- **Normalize mistakes** — \"Most students find this tricky at first\"" },
        ],
      },
      {
        title: "Cross-Cultural Sensitivity",
        lessons: [
          { title: "Working with U.S. Students", content: "# Cross-Cultural Awareness\n\nAs a Latin American tutor working with U.S. students, cultural awareness enhances your effectiveness.\n\n## Communication Styles\n\n### Directness\nU.S. communication tends to be more direct. Students may:\n- Ask direct questions about your qualifications\n- Provide direct feedback about session pace\n- Express preferences openly\n\nThis isn't rudeness — it's a cultural norm. Respond with equal directness and professionalism.\n\n### Informality\nMany U.S. students prefer a friendly, informal tone. Using first names is standard. However, always maintain professionalism.\n\n## Time Zones\n\nBeing aware of U.S. time zones is essential:\n- EST (Eastern) — New York, Miami\n- CST (Central) — Chicago, Houston\n- MST (Mountain) — Denver, Phoenix\n- PST (Pacific) — Los Angeles, Seattle\n\n## Cultural Sensitivity Tips\n\n- Avoid assumptions about a student's background\n- Be aware of U.S. holidays and school calendars\n- Respect diverse family structures and cultural practices" },
        ],
      },
    ],
  },
};

// Add placeholder data for other courses
["english-conversation", "kids-teens", "stem", "writing", "video", "chat"].forEach((id) => {
  if (!COURSE_DATA[id]) {
    COURSE_DATA[id] = {
      title: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: "📚",
      certificate: `${id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Specialist`,
      duration: "6 hours",
      modules: [
        {
          title: "Introduction",
          lessons: [
            { title: "Getting Started", content: "# Getting Started\n\nThis course is coming soon with detailed content. Check back for updates!" },
          ],
        },
      ],
    };
  }
});

export default function CourseDetail() {
  const { courseId } = useParams();
  const course = COURSE_DATA[courseId || ""];
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);

  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-foreground">Course not found</h2>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/dashboard/courses">Back to Courses</Link>
        </Button>
      </div>
    );
  }

  const currentModule = course.modules[activeModule];
  const currentLesson = currentModule?.lessons[activeLesson];
  const totalLessons = course.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0);
  let lessonNumber = 0;
  for (let i = 0; i < activeModule; i++) lessonNumber += course.modules[i].lessons.length;
  lessonNumber += activeLesson + 1;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/courses"><ArrowLeft className="mr-1 h-4 w-4" /> All Courses</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar - Module list */}
        <div className="rounded-xl border bg-card p-4 shadow-card h-fit">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{course.icon}</span>
            <div>
              <h2 className="font-semibold text-sm text-foreground">{course.title}</h2>
              <p className="text-xs text-muted-foreground">{course.duration}</p>
            </div>
          </div>
          <div className="space-y-1">
            {course.modules.map((mod: any, mi: number) => (
              <div key={mi}>
                <button
                  onClick={() => { setActiveModule(mi); setActiveLesson(0); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${mi === activeModule ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                  Module {mi + 1}: {mod.title}
                </button>
                {mi === activeModule && (
                  <div className="ml-4 space-y-0.5 mt-1">
                    {mod.lessons.map((lesson: any, li: number) => (
                      <button
                        key={li}
                        onClick={() => setActiveLesson(li)}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${li === activeLesson ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {lesson.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {course.certificate && (
            <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-accent">Certificate</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{course.certificate}</p>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="rounded-xl border bg-card p-6 md:p-8 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground">Lesson {lessonNumber} of {totalLessons}</span>
            <Progress value={(lessonNumber / totalLessons) * 100} className="w-32 h-2" />
          </div>

          {currentLesson && (
            <div className="prose prose-sm max-w-none">
              {currentLesson.content.split("\n").map((line: string, i: number) => {
                if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold text-foreground mb-4">{line.slice(2)}</h1>;
                if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-semibold text-foreground mt-6 mb-3">{line.slice(3)}</h2>;
                if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold text-foreground mt-4 mb-2">{line.slice(4)}</h3>;
                if (line.startsWith("- ")) return <li key={i} className="text-sm text-muted-foreground ml-4">{line.slice(2)}</li>;
                if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-sm font-semibold text-foreground mt-2">{line.slice(2, -2)}</p>;
                if (line.trim() === "") return <br key={i} />;
                return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>;
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={activeModule === 0 && activeLesson === 0}
              onClick={() => {
                if (activeLesson > 0) setActiveLesson(activeLesson - 1);
                else if (activeModule > 0) {
                  setActiveModule(activeModule - 1);
                  setActiveLesson(course.modules[activeModule - 1].lessons.length - 1);
                }
              }}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Previous
            </Button>

            <Button variant="success" size="sm">
              <CheckCircle className="mr-1 h-4 w-4" /> Mark as Complete
            </Button>

            <Button
              size="sm"
              disabled={activeModule === course.modules.length - 1 && activeLesson === currentModule.lessons.length - 1}
              onClick={() => {
                if (activeLesson < currentModule.lessons.length - 1) setActiveLesson(activeLesson + 1);
                else if (activeModule < course.modules.length - 1) {
                  setActiveModule(activeModule + 1);
                  setActiveLesson(0);
                }
              }}
            >
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
