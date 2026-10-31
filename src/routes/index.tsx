import { createFileRoute } from "@tanstack/react-router";
import { Plus, Lightbulb, Compass, Search, ClipboardCheck, CalendarDays } from "lucide-react";
import { Navbar } from "@/components/foundrlens/navbar";
import { SearchBar } from "@/components/foundrlens/search-bar";
import { FeatureCard } from "@/components/foundrlens/feature-card";
import { RecentlyExplored } from "@/components/foundrlens/recently-explored";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FoundrLens AI — Explore & Validate Startup Ideas" },
      {
        name: "description",
        content:
          "Validate your idea, discover opportunities, and turn your vision into a startup.",
      },
      { property: "og:title", content: "FoundrLens AI — Explore & Validate Startup Ideas" },
      {
        property: "og:description",
        content: "Validate your idea, discover opportunities, and turn your vision into a startup.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const cards = [
  {
    title: "New Startup Idea",
    description: "Analyze a new idea and discover its potential.",
    icon: Plus,
    to: "/analyze",
    accent: true,
  },
  {
    title: "AI Idea Validator",
    description: "Find weaknesses, test assumptions, and identify your target users.",
    icon: Lightbulb,
    to: "/analyze",
  },
  {
    title: "Startup Opportunities",
    description: "Discover relevant hackathons, grants, incubators, and competitions.",
    icon: Compass,
    to: "/explore",
  },
  {
    title: "Competitor Research",
    description: "Explore existing solutions and discover opportunities to differentiate.",
    icon: Search,
    to: "/analyze",
  },
  {
    title: "Eligibility Checker",
    description: "Analyze opportunity requirements against your founder profile.",
    icon: ClipboardCheck,
    to: "/eligibility",
  },
  {
    title: "30-Day Startup Plan",
    description: "Turn your idea into a practical execution roadmap.",
    icon: CalendarDays,
    to: "/analyze",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1040px] px-4 pb-24 pt-16 sm:px-6 sm:pt-20">
        {/* Centered hero */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            What startup idea would you like to explore?
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Validate your idea, discover opportunities, and turn your vision into a startup.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <SearchBar autoFocus />
        </div>

        {/* Feature card grid */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <FeatureCard
              key={card.title}
              title={card.title}
              description={card.description}
              icon={card.icon}
              to={card.to}
              accent={card.accent}
            />
          ))}
        </div>

        {/* Example ideas — demo data until a user database is connected */}
        <RecentlyExplored />
      </main>
    </div>
  );
}
