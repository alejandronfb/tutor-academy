import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Award, ArrowRight, ArrowDown, CheckCircle, Shield, Target, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";

const VALUE_PILLARS = [
  { icon: "📚", title: "Practical Learning", desc: "Short, focused courses designed for working tutors" },
  { icon: "🏅", title: "Private Progress", desc: "Track your growth with badges and specialization milestones" },
  { icon: "📜", title: "Verified Credentials", desc: "Earn certificates with verification links for your CV and LinkedIn" },
  { icon: "🎯", title: "Specialization Tracks", desc: "Build advanced expertise in your teaching area" },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Learn", desc: "Complete practical courses at your own pace" },
  { step: 2, title: "Assess", desc: "Check your skills with private assessments" },
  { step: 3, title: "Earn", desc: "Receive verified badges and certificates" },
  { step: 4, title: "Share", desc: "Use credentials on your CV and LinkedIn" },
];

const Index = () => {
  const { data: stats } = useQuery({
    queryKey: ["homepage-stats"],
    queryFn: async () => {
      const [tutors, certs, courses] = await Promise.all([
        supabase.from("tutor_profiles").select("id", { count: "exact", head: true }),
        supabase.from("certifications").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
      ]);
      return {
        tutors: tutors.count ?? 0,
        certs: certs.count ?? 0,
        courses: courses.count ?? 0,
      };
    },
  });

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 opacity-10">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="container relative z-10 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-primary-foreground md:text-6xl">
              Professional Growth for Active LatinHire Tutors
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/70 md:text-xl">
              A private learning and credential platform. Complete practical courses, earn verified certificates, and build credentials for your CV and LinkedIn.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/login">
                  Enter the Academy
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" onClick={scrollToHowItWorks}>
                See How It Works <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {VALUE_PILLARS.map((pillar) => (
            <div key={pillar.title} className="rounded-xl border bg-card p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300">
              <div className="text-4xl mb-4">{pillar.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-secondary/50 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Four steps to build your professional credentials
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="relative rounded-xl border bg-card p-8 text-center shadow-card">
                <div className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full gradient-orange text-xs font-bold text-accent-foreground">
                  {step.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credential Value */}
      <section className="container py-20">
        <div className="rounded-xl border bg-card p-8 md:p-12 shadow-card text-center max-w-3xl mx-auto">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-orange">
            <Award className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Credential Value</h2>
          <p className="text-muted-foreground">
            Your certificates include a unique verification link, downloadable PDF, and LinkedIn-ready details. Built to support your professional profile.
          </p>
        </div>
      </section>

      {/* Private by Design */}
      <section className="bg-secondary/50 py-20">
        <div className="container">
          <div className="rounded-xl gradient-navy p-8 md:p-12 text-center max-w-3xl mx-auto">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10">
              <Shield className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-primary-foreground mb-4">Private by Design</h2>
            <p className="text-primary-foreground/70">
              Tutor Academy is a private platform for LatinHire tutors. Your progress, achievements, and learning are yours alone.
            </p>
          </div>
        </div>
      </section>

      {/* Stats — only show if 10+ tutors */}
      {stats && stats.tutors >= 10 && (
        <section className="gradient-navy py-16">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-3 text-center">
              {[
                { value: stats.tutors, label: "Active Learners" },
                { value: stats.certs, label: "Credentials Issued" },
                { value: stats.courses, label: "Professional Courses" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-4xl font-extrabold text-accent mb-1">{stat.value}</div>
                  <div className="text-sm text-primary-foreground/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="container py-20 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">Start Your Professional Development</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Build credentials at your own pace. Available for all active LatinHire tutors.
        </p>
        <Button variant="success" size="lg" asChild>
          <Link to="/register">
            Enter the Academy <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
