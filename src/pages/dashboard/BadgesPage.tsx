import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const BADGES = [
  { name: "Verified LatinHire Tutor", icon: "✔️", desc: "Registered with valid invitation code", unlocked: true },
  { name: "Certified Tutor", icon: "🎓", desc: "Complete Foundations course", unlocked: false },
  { name: "Conversation Expert", icon: "💬", desc: "Complete English Conversation course", unlocked: false },
  { name: "Kids Specialist", icon: "👶", desc: "Complete Kids Teaching course", unlocked: false },
  { name: "STEM Expert", icon: "🔬", desc: "Complete STEM course", unlocked: false },
  { name: "Writing Pro", icon: "✍️", desc: "Complete Writing course", unlocked: false },
  { name: "Video Tutor", icon: "📹", desc: "Complete Video Mastery", unlocked: false },
  { name: "Chat Tutor", icon: "💬", desc: "Complete Chat Mastery", unlocked: false },
  { name: "Week Warrior", icon: "🔥", desc: "7-day learning streak", unlocked: false },
  { name: "Bookworm", icon: "📚", desc: "Complete 3 courses", unlocked: false },
  { name: "Overachiever", icon: "🏆", desc: "Complete all courses", unlocked: false },
  { name: "Early Adopter", icon: "⭐", desc: "Join in the first month", unlocked: false },
  { name: "Perfect Score", icon: "🎯", desc: "Score 100% on any final assessment", unlocked: false },
];

export default function BadgesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Badges</h1>
        <p className="text-sm text-muted-foreground mt-1">Achievements and milestones in your learning journey</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {BADGES.map((badge) => (
          <Tooltip key={badge.name}>
            <TooltipTrigger asChild>
              <div className={`rounded-xl border p-5 text-center transition-all ${badge.unlocked ? "bg-card shadow-card" : "bg-muted/50 opacity-50 grayscale"}`}>
                <div className="text-4xl mb-2">{badge.icon}</div>
                <div className="font-medium text-xs text-foreground">{badge.name}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{badge.unlocked ? "Unlocked!" : `How to unlock: ${badge.desc}`}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
