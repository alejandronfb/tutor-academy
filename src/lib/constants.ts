export const LATIN_COUNTRIES = [
  "Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Costa Rica",
  "Cuba", "Dominican Republic", "Ecuador", "El Salvador", "Guatemala",
  "Honduras", "Mexico", "Nicaragua", "Panama", "Paraguay", "Peru",
  "Puerto Rico", "Uruguay", "Venezuela",
] as const;

export const ENGLISH_LEVELS = ["B2", "C1", "C2", "Native"] as const;

export const EXPERIENCE_RANGES = ["0-1", "2-3", "4-5", "6+"] as const;

export const MODALITIES = ["Video", "Chat", "Both"] as const;

export const SPECIALIZATIONS = [
  "English for Adults",
  "English for Kids & Teens",
  "STEM (Math, Science, Statistics)",
  "Writing & Essays",
  "Test Prep (SAT, ACT, GRE)",
] as const;

export const TUTOR_LEVELS = {
  1: { name: "Certified Tutor", color: "bg-muted" },
  2: { name: "Advanced Tutor", color: "bg-primary" },
  3: { name: "Expert Tutor", color: "bg-primary" },
  4: { name: "Master Tutor", color: "gradient-navy" },
} as const;

export const PATHWAYS = [
  {
    id: "core",
    name: "Core Path",
    description: "Essential skills every professional tutor should develop",
    icon: "🎓",
    color: "from-primary to-navy-light",
  },
  {
    id: "english",
    name: "English Tutor Path",
    description: "Specialized techniques for teaching English conversation and to young learners",
    icon: "💬",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "stem",
    name: "STEM Tutor Path",
    description: "Methods for teaching math, science, and analytical subjects effectively",
    icon: "🔬",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "writing",
    name: "Writing Tutor Path",
    description: "Skills for guiding students through academic and creative writing",
    icon: "✍️",
    color: "from-amber-500 to-orange-500",
  },
] as const;
