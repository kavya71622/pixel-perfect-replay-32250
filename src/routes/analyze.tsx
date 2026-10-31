import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, AlertCircle, Loader2, BookmarkPlus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/foundrlens/navbar";
import { api, type IdeaAnalysis } from "@/lib/api";

export const Route = createFileRoute("/analyze")({
  validateSearch: (search: Record<string, unknown>): { idea?: string } => {
    const value = search["idea"];
    return typeof value === "string" && value.trim().length > 0 ? { idea: value.trim() } : {};
  },
  head: () => ({ meta: [{ title: "Idea Analysis — FoundrLens AI" }, { name: "description", content: "Analyze and validate your startup idea." }] }),
  component: AnalyzePage,
});

const sections: { title: string; key: keyof IdeaAnalysis }[] = [
  {title:"Problem being solved",key:"problem"}, {title:"Target customers",key:"customers"},
  {title:"Strengths",key:"strengths"}, {title:"Risks and weaknesses",key:"risks"},
  {title:"Competitors to research",key:"competitors_to_research"}, {title:"MVP recommendations",key:"mvp"},
  {title:"Customer validation questions",key:"validation_questions"}, {title:"Recommended next steps",key:"next_steps"},
  {title:"Assumptions to verify",key:"assumptions"},
];
function AnalyzePage() {
  const { idea } = Route.useSearch();
  const [result,setResult] = useState<IdeaAnalysis|null>(null);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);
  const [roadmap,setRoadmap] = useState<Record<string, any>|null>(null);
  const [roadmapLoading,setRoadmapLoading] = useState(false);
  const [draft,setDraft] = useState(idea || "");
  async function run(value:string) {
    if(value.trim().length < 10){setError("Please describe your idea in at least 10 characters.");return;}
    setLoading(true);setError("");setResult(null);
    try { const data=await api.analyze(value.trim());setResult(data); }
    catch(e){setError(e instanceof Error?e.message:"Analysis failed. Please try again.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{if(idea) void run(idea);},[idea]);
  function save(){
    if(!result)return;
    const key="foundrlens_saved_startups";
    const old=JSON.parse(localStorage.getItem(key)||"[]") as {idea:string;summary:string;date:string}[];
    if(!old.some(x=>x.idea===result.idea)){localStorage.setItem(key,JSON.stringify([{idea:result.idea,summary:result.summary,date:new Date().toISOString()},...old]));}
    setError("Saved to My Startups on this browser.");
  }
  return <div className="min-h-screen bg-background"><Navbar/><main className="mx-auto w-full max-w-[880px] px-4 pb-24 pt-10 sm:px-6">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5"/>Back to home</Link>
    <div className="mt-6"><h1 className="text-2xl font-semibold tracking-tight text-foreground">Startup Idea Analysis</h1><p className="mt-2 text-sm text-muted-foreground">Get a structured first-pass assessment from your local AI model. Treat estimates as hypotheses to validate.</p></div>
    <form className="mt-6 rounded-[10px] border border-border bg-card p-4" onSubmit={e=>{e.preventDefault();void run(draft);}}>
      <label htmlFor="idea" className="text-sm font-medium text-foreground">Describe your startup idea</label>
      <textarea id="idea" value={draft} onChange={e=>setDraft(e.target.value)} rows={4} placeholder="Who has the problem, what is the problem, and how will your solution help?" className="mt-2 w-full resize-y rounded-md border border-input bg-background p-3 text-sm text-foreground outline-none focus:border-primary"/>
      <button disabled={loading||draft.trim().length<10} className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{loading?<Loader2 className="size-4 animate-spin"/>:<Sparkles className="size-4"/>}{loading?"Analyzing with Gemma…":"Analyze my idea"}</button>
    </form>
    {error&&<div role="alert" className="mt-4 flex gap-2 rounded-md border border-warning/30 bg-card p-3 text-sm text-muted-foreground"><AlertCircle className="size-4 shrink-0 text-warning"/>{error}</div>}
    {result&&<>
      <section className="mt-7 rounded-[10px] border border-primary/30 bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-medium uppercase tracking-wide text-primary">AI assessment · {result.model}</span><span className="text-sm text-muted-foreground">Initial score: <strong className="text-foreground">{result.score}/10</strong></span></div><h2 className="mt-3 text-lg font-semibold text-foreground">{result.verdict}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.summary}</p><button onClick={save} className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"><BookmarkPlus className="size-4"/>Save to My Startups</button></section>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{sections.map(s=>{const value=result[s.key];return <section key={s.key} className="rounded-[10px] border border-border bg-card p-5"><h3 className="text-sm font-semibold text-foreground">{s.title}</h3>{Array.isArray(value)?<ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted-foreground">{value.map((v,i)=><li key={i}>{v}</li>)}</ul>:<p className="mt-3 text-sm leading-relaxed text-muted-foreground">{String(value??"")}</p>}</section>;})}</div>
      <div className="mt-7 rounded-[10px] border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-foreground">30-day startup roadmap</h2><p className="mt-1 text-xs text-muted-foreground">A validation-first plan generated for this idea.</p></div><button disabled={roadmapLoading} onClick={async()=>{setRoadmapLoading(true);setError("");try{setRoadmap(await api.roadmap(result.idea));}catch(e){setError(e instanceof Error?e.message:"Could not create roadmap");}finally{setRoadmapLoading(false);}}} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-foreground disabled:opacity-50">{roadmapLoading?<Loader2 className="size-4 animate-spin"/>:<Sparkles className="size-4"/>}{roadmapLoading?"Building plan…":"Generate roadmap"}</button></div>{roadmap&&<><p className="mt-3 text-sm text-muted-foreground">{roadmap.goal}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{[1,2,3,4].map(n=>{const w=roadmap[`week_${n}`];return <div key={n} className="rounded-md border border-border p-4"><h3 className="text-sm font-semibold text-foreground">Week {n}: {w?.focus}</h3><ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">{(w?.tasks||[]).map((t:string,i:number)=><li key={i}>{t}</li>)}</ul><p className="mt-3 text-xs text-primary">Deliverable: {w?.deliverable}</p></div>;})}</div><div className="mt-4"><h3 className="text-sm font-semibold text-foreground">Success metrics</h3><ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">{(roadmap.success_metrics||[]).map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div></>}</div>
      <p className="mt-5 text-xs leading-relaxed text-tertiary">AI output is a starting point, not market research or professional advice. Competitor names, demand, pricing and legal requirements must be independently verified.</p>
    </>}
  </main></div>;
}
