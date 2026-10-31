import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, BookmarkCheck, ExternalLink, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar, DemoBadge } from "@/components/foundrlens/navbar";
import { SearchBar } from "@/components/foundrlens/search-bar";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Startup Opportunities — FoundrLens AI" },
      {
        name: "description",
        content: "Discover hackathons, grants, incubators and competitions for student founders.",
      },
      { property: "og:title", content: "Startup Opportunities — FoundrLens AI" },
      {
        property: "og:description",
        content: "Discover hackathons, grants, incubators and competitions for student founders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorePage,
});

interface Opportunity {
  org: string;
  title: string;
  type: "Hackathon" | "Grant" | "Incubator" | "Competition";
  industry: string;
  location: string;
  deadline: string; // ISO date — sample data only
  eligibility: string;
}

/** Sample rows shown until a real opportunity database is connected. */
const sampleOpportunities: Opportunity[] = [
  {
    org: "Sample Innovation Foundation",
    title: "AI for Good Student Challenge",
    type: "Competition",
    industry: "AI",
    location: "Online",
    deadline: "2026-12-15",
    eligibility: "Open to enrolled students; teams of 2–4.",
  },
  {
    org: "Sample University Venture Fund",
    title: "Campus Startup Seed Grant",
    type: "Grant",
    industry: "Education",
    location: "India",
    deadline: "2027-01-10",
    eligibility: "Student-led startups with a working prototype.",
  },
  {
    org: "Sample Incubator",
    title: "Early-Stage Founder Sprint",
    type: "Incubator",
    industry: "Sustainability",
    location: "Europe",
    deadline: "2026-12-05",
    eligibility: "Pre-seed teams; no revenue requirement.",
  },
  {
    org: "Sample Hackathon Collective",
    title: "National Student Hackathon",
    type: "Hackathon",
    industry: "AI",
    location: "United States",
    deadline: "2026-11-28",
    eligibility: "Undergraduate and graduate students.",
  },
  {
    org: "Sample Health Alliance",
    title: "Digital Health Pitch Day",
    type: "Competition",
    industry: "Health",
    location: "India",
    deadline: "2027-01-20",
    eligibility: "Early-stage health or wellness ventures.",
  },
  {
    org: "Sample Climate Fund",
    title: "Green Startup Micro-Grant",
    type: "Grant",
    industry: "Sustainability",
    location: "Online",
    deadline: "2026-12-30",
    eligibility: "Ideas or prototypes addressing sustainability.",
  },
];

const industryOptions = ["AI", "Education", "Sustainability", "Health"];
const locationOptions = ["Online", "India", "United States", "Europe"];
const deadlineOptions = [
  { value: "30", label: "Next 30 days" },
  { value: "90", label: "Next 90 days" },
  { value: "later", label: "Later" },
];

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function matchesDeadline(iso: string, filter: string) {
  if (!filter) return true;
  const deadline = new Date(`${iso}T00:00:00Z`).getTime();
  const now = Date.now();
  if (filter === "later") return deadline > now + 90 * 86_400_000;
  return deadline > now && deadline <= now + Number(filter) * 86_400_000;
}

function ExplorePage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const results = sampleOpportunities.filter((opportunity) => {
    const haystack = `${opportunity.title} ${opportunity.org}`.toLowerCase();
    return (
      (!query || haystack.includes(query.toLowerCase())) &&
      (!type || opportunity.type === type) &&
      (!industry || opportunity.industry === industry) &&
      (!location || opportunity.location === location) &&
      matchesDeadline(opportunity.deadline, deadline)
    );
  });

  function toggleSaved(title: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1040px] px-4 pb-24 pt-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Startup Opportunities
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hackathons, grants, incubators and competitions for student founders.
            </p>
          </div>
          <DemoBadge label="Sample data" />
        </div>

        <div className="mt-6">
          <SearchBar
            initialIdea={query}
            placeholder="Search opportunities by title or organization..."
            navigateOnSubmit={false}
            onChange={(value) => setQuery(value)}
          />
        </div>

        <div className="mt-5 rounded-md border border-warning/30 bg-card px-4 py-3 text-xs leading-relaxed text-muted-foreground">These are illustrative placeholder entries only — not real or verified opportunities. Do not rely on their names, eligibility rules, or deadlines. Connect an official organizer source before using this section for applications.</div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FilterSelect
            ariaLabel="Filter by type"
            placeholder="Type"
            value={type}
            onChange={setType}
            options={["Hackathon", "Grant", "Incubator", "Competition"]}
          />
          <FilterSelect
            ariaLabel="Filter by industry"
            placeholder="Industry"
            value={industry}
            onChange={setIndustry}
            options={industryOptions}
          />
          <FilterSelect
            ariaLabel="Filter by location"
            placeholder="Location"
            value={location}
            onChange={setLocation}
            options={locationOptions}
          />
          <FilterSelect
            ariaLabel="Filter by deadline"
            placeholder="Deadline"
            value={deadline}
            onChange={setDeadline}
            options={deadlineOptions.map((option) => option.value)}
            valueLabels={Object.fromEntries(deadlineOptions.map((o) => [o.value, o.label]))}
          />
        </div>

        {/* Opportunity cards */}
        {results.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {results.map((opportunity) => (
              <li
                key={opportunity.title}
                className="rounded-[10px] border border-border bg-card p-5 transition-colors hover:bg-accent"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-tertiary">
                        {opportunity.type}
                      </span>
                      <span className="text-xs text-tertiary">{opportunity.org}</span>
                    </div>
                    <h2 className="mt-1.5 text-[15px] font-semibold tracking-tight text-foreground">
                      {opportunity.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Eligibility: {opportunity.eligibility}
                    </p>
                    <p className="mt-1 text-xs text-tertiary">
                      {opportunity.location} · Deadline {formatDate(opportunity.deadline)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSaved(opportunity.title)}
                      aria-pressed={saved.has(opportunity.title)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {saved.has(opportunity.title) ? (
                        <BookmarkCheck className="size-3.5 text-success" aria-hidden />
                      ) : (
                        <Bookmark className="size-3.5" aria-hidden />
                      )}
                      {saved.has(opportunity.title) ? "Saved" : "Save"}
                    </button>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-secondary px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      title="Sample data — no official source is linked"
                    >
                      Source
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 flex flex-col items-center rounded-[10px] border border-border bg-card px-6 py-14 text-center">
            <Search className="size-5 text-tertiary" aria-hidden />
            <p className="mt-3 text-sm font-medium text-foreground">No opportunities match</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try clearing a filter or searching for something broader.
            </p>
          </div>
        )}

        <p className="mt-6 text-xs text-tertiary">
          All entries above are sample data for demonstration only — no real funding programmes,
          deadlines or eligibility claims.
        </p>
      </main>
    </div>
  );
}

interface FilterSelectProps {
  ariaLabel: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  valueLabels?: Record<string, string>;
}

function FilterSelect({ ariaLabel, placeholder, value, onChange, options, valueLabels }: FilterSelectProps) {
  return (
    <Select
      {...(value ? { value } : {})}
      onValueChange={(next) => onChange(next === "__all" ? "" : next)}
    >
      <SelectTrigger aria-label={ariaLabel} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {valueLabels?.[option] ?? option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
