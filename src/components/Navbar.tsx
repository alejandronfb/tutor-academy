import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="gradient-navy flex h-9 w-9 items-center justify-center rounded-lg">
            <GraduationCap className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">
            LatinHire <span className="font-medium text-muted-foreground">Tutor Academy</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Courses
          </Link>
          <Link to="/pathways" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Learning Paths
          </Link>
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Log In
          </Link>
          <Button variant="success" size="sm" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background p-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/courses" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Courses</Link>
            <Link to="/pathways" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Learning Paths</Link>
            <Link to="/login" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Log In</Link>
            <Button variant="success" size="sm" asChild>
              <Link to="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
