import { Link } from "@tanstack/react-router";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  accent?: boolean | undefined;
}

/**
 * Repository-card-style tile for the homepage grid. Hover raises the card
 * slightly and lightens the surface; the arrow button sits bottom-right.
 */
export function FeatureCard({ title, description, icon: Icon, to, accent }: FeatureCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex flex-col rounded-[10px] border border-border bg-card p-5",
        "min-h-[150px] transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-border hover:bg-accent",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        accent && "card-accent"
      )}
    >
      <Icon className="size-4 text-primary" aria-hidden />
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <span
        aria-hidden
        className="absolute bottom-4 right-4 flex size-7 items-center justify-center rounded-md text-tertiary transition-colors group-hover:bg-secondary group-hover:text-foreground"
      >
        <ArrowUpRight className="size-4" />
      </span>
    </Link>
  );
}
