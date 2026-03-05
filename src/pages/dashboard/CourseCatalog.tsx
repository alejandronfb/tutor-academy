import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Users, Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const COURSES = [
  { id: "foundations", title: "LatinHire Tutor Foundations", description: "Essential skills every professional tutor should develop. Learn the LatinHire standard, professional communication, and student engagement.", pathway: "Core", difficulty: "Beginner", duration: "8 hours", modules: 5, icon: "🎓", enrolled: 342 },
  { id: "english-conversation", title: "Teaching English Conversation", description: "Specialized techniques for conversation flow, natural error correction, pronunciation coaching, and adapting to student levels.", pathway: "English", difficulty: "Intermediate", duration: "6 hours", modules: 5, icon: "💬", enrolled: 218 },
  { id: "kids-teens", title: "Teaching Kids & Teens Online", description: "Master attention management, interactive techniques, visual aids, and building rapport with young learners.", pathway: "English", difficulty: "Intermediate", duration: "6 hours", modules: 5, icon: "👶", enrolled: 156 },
  { id: "stem", title: "STEM Tutoring Mastery", description: "Learn to explain abstract concepts, step-by-step problem solving, visual tools, and building mathematical thinking.", pathway: "STEM", difficulty: "Intermediate", duration: "7 hours", modules: 5, icon: "🔬", enrolled: 189 },
  { id: "writing", title: "Writing Tutor Excellence", description: "Guide students through essay structure, actionable feedback, finding their voice, and academic writing standards.", pathway: "Writing", difficulty: "Intermediate", duration: "6 hours", modules: 5, icon: "✍️", enrolled: 134 },
  { id: "video", title: "Video Tutoring Mastery", description: "Verbal clarity, camera presence, screen sharing best practices, and managing awkward silences.", pathway: "Modality", difficulty: "Beginner", duration: "4 hours", modules: 4, icon: "📹", enrolled: 267 },
  { id: "chat", title: "Chat Tutoring Mastery", description: "Write clear explanations, format solutions for readability, and manage efficiency in text-based tutoring.", pathway: "Modality", difficulty: "Beginner", duration: "4 hours", modules: 4, icon: "💬", enrolled: 198 },
];

export default function CourseCatalog() {
  const [search, setSearch] = useState("");
  const [pathwayFilter, setPathwayFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const filtered = COURSES.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (pathwayFilter !== "all" && c.pathway !== pathwayFilter) return false;
    if (difficultyFilter !== "all" && c.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Course Catalog</h1>
        <p className="text-sm text-muted-foreground mt-1">Explore professional development courses at your own pace</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={pathwayFilter} onValueChange={setPathwayFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Pathway" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pathways</SelectItem>
            <SelectItem value="Core">Core</SelectItem>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="STEM">STEM</SelectItem>
            <SelectItem value="Writing">Writing</SelectItem>
            <SelectItem value="Modality">Modality</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <div key={course.id} className="rounded-xl border bg-card p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
            <div className="text-3xl mb-3">{course.icon}</div>
            <div className="flex gap-2 mb-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{course.pathway}</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{course.difficulty}</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">{course.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 flex-1">{course.description}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</span>
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.modules} modules</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.enrolled}</span>
            </div>
            <Button size="sm" className="w-full" asChild>
              <Link to={`/dashboard/courses/${course.id}`}>
                View Course <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
