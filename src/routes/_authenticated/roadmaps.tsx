import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/foundrlens/navbar";
import { RoadmapView } from "@/components/foundrlens/roadmap-view";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/roadmaps")({
  head: () => ({ meta: [{ title: "My Roadmaps — FoundrLens AI" }, { name: "description", content: "Track your saved 30-day startup roadmaps." }, { property: "og:title", content: "My Roadmaps — FoundrLens AI" }, { property: "og:description", content: "Track your saved 30-day startup roadmaps." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: RoadmapsPage,
});

type Row = { id: string; idea: string; plan: any; completed: string[]; created_at: string };

function RoadmapsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("roadmaps")
      .select("id,idea,plan,completed,created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setRows((data as Row[]) ?? []);
        if (data?.[0]) setOpen(data[0].id);
      });
  }, []);

  async function toggle(row: Row, id: string) {
    const completed = row.completed.includes(id) ? row.completed.filter((x) => x !== id) : [...row.completed, id];
    setRows((r) => r!.map((x) => (x.id === row.id ? { ...x, completed } : x)));
    const { error } = await supabase.from("roadmaps").update({ completed, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) toast.error("Could not save progress: " + error.message);
  }
  async function remove(id: string) {
    const { error } = await supabase.from("roadmaps").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((r) => r!.filter((x) => x.id !== id));
    toast.success("Roadmap deleted");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[880px] px-4 pb-24 pt-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-foreground">My 30-day roadmaps</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tick off tasks as you go — progress is saved to your account.</p>
        {rows === null ? (
          <div className="mt-10 flex justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-xl border border-border bg-card px-6 py-14 text-center">
            <CalendarDays className="size-5 text-tertiary" />
            <p className="mt-3 text-sm font-medium text-foreground">No roadmaps yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Analyze an idea, then generate a roadmap from the results.</p>
            <Link to="/analyze" className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Analyze an idea</Link>
          </div>
        ) : (
          <ul className="mt-7 space-y-3">
            {rows.map((row) => (
              <li key={row.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => setOpen(open === row.id ? null : row.id)} className="text-left">
                    <h2 className="text-sm font-semibold text-foreground">{row.idea}</h2>
                    <p className="mt-1 text-xs text-tertiary">Created {new Date(row.created_at).toLocaleDateString()}</p>
                  </button>
                  <button onClick={() => remove(row.id)} aria-label="Delete roadmap" className="rounded-md p-2 text-muted-foreground hover:bg-accent"><Trash2 className="size-4" /></button>
                </div>
                {open === row.id && <div className="mt-5"><RoadmapView plan={row.plan} completed={row.completed} onToggle={(id) => toggle(row, id)} /></div>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
