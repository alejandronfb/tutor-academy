import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, Award, ArrowRight, Users, CheckCircle, Sparkles } from "lucide-react";
import { PATHWAYS } from "@/lib/constants";
import heroBg from "@/assets/hero-bg.jpg";

const STEPS = [
  { icon: Users, title: "Sign Up", desc: "Register with your LatinHire invitation code to access the academy" },
  { icon: BookOpen, title: "Complete Courses", desc: "Learn at your own pace with expert-crafted professional development content" },
  { icon: Award, title: "Earn Certifications", desc: "Showcase your expertise with verifiable professional certificates" },
];

const Index = () => {
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
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-success/20 px-4 py-1.5 text-sm font-medium text-success">
              <Sparkles className="h-4 w-4" />
              Free professional development
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-primary-foreground md:text-6xl">
              Grow as a Professional Tutor
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/70 md:text-xl">
              Optional professional development resources and certifications for independent tutors. Build skills, earn credentials, and discover new opportunities.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/register">
                  Start Learning — It's Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="/courses">Explore Courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">How It Works</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Professional growth at your own pace — three simple steps to get started
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={i} className="relative rounded-xl border bg-card p-8 text-center shadow-card hover:shadow-card-hover transition-shadow duration-300">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl gradient-navy">
                <step.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full gradient-green text-xs font-bold text-accent-foreground">
                {i + 1}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Paths */}
      <section className="bg-secondary/50 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Learning Paths</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Structured pathways designed to develop specialized teaching expertise
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PATHWAYS.map((path) => (
              <div
                key={path.id}
                className="group rounded-xl border bg-card p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="mb-4 text-4xl">{path.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{path.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{path.description}</p>
                <Link
                  to="/pathways"
                  className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View Path <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Professional Certifications</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Earn verifiable credentials to showcase your teaching expertise
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "LatinHire Certified Professional Tutor",
            "English Conversation Specialist",
            "STEM Teaching Specialist",
          ].map((cert) => (
            <div
              key={cert}
              className="flex items-center gap-3 rounded-xl border bg-card p-5 shadow-card"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-green">
                <CheckCircle className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="font-medium text-foreground text-sm">{cert}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="gradient-navy py-16">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3 text-center">
            {[
              { value: "500+", label: "Tutors Trained" },
              { value: "1,200+", label: "Certificates Issued" },
              { value: "7", label: "Professional Courses" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-extrabold text-success mb-1">{stat.value}</div>
                <div className="text-sm text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Grow Your Teaching Career?</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Professional development at your own pace. Free for all LatinHire network tutors.
        </p>
        <Button variant="success" size="lg" asChild>
          <Link to="/register">
            Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
