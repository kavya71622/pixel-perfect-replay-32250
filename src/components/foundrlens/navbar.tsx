import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Menu, Focus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { navbarLinkClass } from "./search-bar";

const links = [
  { label: "Explore Opportunities", to: "/explore" },
  { label: "Eligibility Checker", to: "/eligibility" },
  { label: "My Startups", to: "/my-startups" },
  { label: "Roadmaps", to: "/roadmaps" },
  { label: "AI Co-Founder", to: "/co-founder" },
] as const;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  async function signOut() { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-4 sm:px-6"
      >
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <span className="flex size-7 items-center justify-center rounded-md border border-border bg-card">
            <Focus className="size-4 text-primary" aria-hidden />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            FoundrLens
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={navbarLinkClass}>
              {link.label}
            </Link>
          ))}
          <Link
            to="/analyze"
            className={cn(
              "inline-flex h-8 items-center rounded-md border border-border bg-card px-3",
              "text-sm font-medium text-foreground transition-colors hover:bg-accent",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            )}
          >
            {user ? "New analysis" : "Get Started"}
          </Link>
          {user ? <button onClick={signOut} className={navbarLinkClass}>Sign out</button> : <Link to="/auth" className={navbarLinkClass}>Sign in</Link>}
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden">
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Menu className="size-5" aria-hidden />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-[1080px] flex-col px-4 py-3 sm:px-6">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/analyze"
              onClick={() => setMenuOpen(false)}
              className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Get Started
            </Link>
            {user ? <button onClick={signOut} className="mt-2 rounded-md px-2 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent">Sign out</button> : <Link to="/auth" onClick={() => setMenuOpen(false)} className="mt-2 rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:bg-accent">Sign in</Link>}
          </div>
        </div>
      )}
    </header>
  );
}

/** Small labelled badge used to mark demo/sample content. */
export function DemoBadge({ label = "Demo data" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-tertiary">
      {label}
    </span>
  );
}
