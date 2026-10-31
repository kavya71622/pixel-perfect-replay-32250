import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { DemoBadge } from "./navbar";

export interface ExploredStartup {
  name: string;
  description: string;
  category: string;
}

/**
 * Example ideas shown while no user database is connected. Each row opens
 * the analysis view pre-filled with the idea.
 */
export const exampleStartups: ExploredStartup[] = [
  {
    name: "CareerCompass",
    description: "AI career guidance for students.",
    category: "EdTech",
  },
  {
    name: "CampusConnect",
    description: "Discover student communities and events.",
    category: "Community",
  },
  {
    name: "EcoTrack",
    description: "Help small businesses monitor sustainability.",
    category: "Sustainability",
  },
];

export function RecentlyExplored({ items = exampleStartups }: { items?: ExploredStartup[] }) {
  return (
    <section aria-labelledby="recently-explored-heading" className="mt-14">
      <div className="flex items-center justify-between gap-4">
        <h2
          id="recently-explored-heading"
          className="text-sm font-medium uppercase tracking-wide text-tertiary"
        >
          Recently Explored
        </h2>
        <DemoBadge />
      </div>

      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-[10px] border border-border bg-card">
        {items.map((startup) => (
          <li key={startup.name}>
            <Link
              to="/analyze"
              search={{ idea: `${startup.name} — ${startup.description}` }}
              className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{startup.name}</span>
                  <span className="hidden rounded-full border border-border px-2 py-0.5 text-[11px] text-tertiary sm:inline">
                    {startup.category}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {startup.description}
                </p>
              </div>
              <ArrowRight
                className="size-4 shrink-0 text-tertiary transition-colors group-hover:text-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
