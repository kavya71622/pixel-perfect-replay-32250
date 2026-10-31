import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, History, Lightbulb, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/foundrlens/navbar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/my-startups")({
  head: () => ({ meta: [{ title: "My Startups — FoundrLens AI" }, { name: "description", content: "Your saved startup ideas and analysis history." }, { property: "og:title", content: "My Startups — FoundrLens AI" }, { property: "og:description", content: "Your saved startup ideas and analysis history." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: MyStartupsPage,
});

type Saved = { id: string; idea: string; summary: string | null; created_at: string };
type Analysis = { id: string; idea: string; result: any; created_at: string };

function MyStartupsPage() {
  const [items, setItems] = useState<Saved[] | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  useEffect(() => {
    supabase.from("startups").select("id,idea,summary,created_at").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error) toast.error(error.message);
      setItems(data ?? []);
    });
    supabase.from("analyses").select("id,idea,result,created_at").order("created_at", { ascending: false }).limit(20).then(({ data }) => setHistory((data as Analysis[]) ?? []));
  }, []);
  async function remove(id: string) {
    const { error } = await supabase.from("startups").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems((x) => x!.filter((i) => i.id !== id));
  }
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[880px] px-4 pb-24 pt-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-foreground">My Startups</h1>
        <p className="mt-2 text-sm text-muted-foreground">Saved ideas are stored privately in your account.</p>
        {items === null ? (
          <div className="mt-10 flex justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : items.length ? (
          <ul className="mt-7 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{item.idea}</h2>
                    {item.summary && <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>}
                    <p className="mt-2 text-xs text-tertiary">Saved {new Date(item.created_at).toLocaleDateString()}</p>
                    <Link to="/analyze" search={{ idea: item.idea }} className="mt-3 inline-block text-xs font-medium text-primary hover:underline">Re-run analysis</Link>
                  </div>
                  <button onClick={() => remove(item.id)} aria-label="Delete saved startup" className="rounded-md p-2 text-muted-foreground hover:bg-accent"><Trash2 className="size-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 flex flex-col items-center rounded-xl border border-border bg-card px-6 py-14 text-center">
            <Lightbulb className="size-5 text-tertiary" />
            <p className="mt-3 text-sm font-medium text-foreground">No saved startups yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">Analyze an idea and choose “Save to My Startups” to keep it here.</p>
            <div className="mt-6 flex gap-2">
              <Link to="/analyze" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Analyze an idea</Link>
              <Link to="/explore" className="inline-flex items-center gap-1 rounded-md border border-border px-4 py-2 text-sm text-foreground"><Compass className="size-4" />Explore</Link>
            </div>
          </div>
        )}
        {history.length > 0 && (
          <section className="mt-12">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground"><History className="size-4" />Analysis history</h2>
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{h.idea}</p>
                    <p className="text-xs text-tertiary">{new Date(h.created_at).toLocaleString()} · score {h.result?.score ?? "–"}/10{h.result?.confidence ? ` · ${h.result.confidence} confidence` : ""}</p>
                  </div>
                  <Link to="/analyze" search={{ idea: h.idea }} className="shrink-0 text-xs text-primary hover:underline">Re-run</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
