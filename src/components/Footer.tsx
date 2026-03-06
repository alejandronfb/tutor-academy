import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="gradient-navy mt-auto">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                <GraduationCap className="h-4 w-4 text-accent" />
              </div>
              <span className="text-lg font-bold text-primary-foreground">
                LatinHire <span className="font-medium text-primary-foreground/70">Tutor Academy</span>
              </span>
            </div>
            <p className="text-sm text-primary-foreground/60 max-w-sm">
              Optional professional development resources and certifications for independent tutors in the LatinHire network.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-primary-foreground mb-3 text-sm">Platform</h4>
            <div className="flex flex-col gap-2">
              <Link to="/dashboard/courses" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Courses</Link>
              <Link to="/dashboard/pathways" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Learning Paths</Link>
              <Link to="/register" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Get Started</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-primary-foreground mb-3 text-sm">Company</h4>
            <div className="flex flex-col gap-2">
              <a href="https://latinhire.com" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors" target="_blank" rel="noopener noreferrer">About LatinHire</a>
              <Link to="/privacy" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/10 pt-6">
          <p className="text-xs text-primary-foreground/40 max-w-3xl">
            LatinHire Tutor Academy offers optional professional development resources for independent tutors. Participation does not create an employment relationship and does not affect a tutor's independent contractor status.
          </p>
          <p className="text-xs text-primary-foreground/40 mt-2">
            © {new Date().getFullYear()} LatinHire. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
