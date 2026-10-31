import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, AlertCircle, Loader2, BookmarkPlus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/foundrlens/navbar";
import { api, type IdeaAnalysis } from "@/lib/api";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "@/hooks/use-auth";
import { RoadmapView } from "@/components/foundrlens/roadmap-view";
import { EconomicTimes } from "@/components/foundrlens/economic-times";

export const Route = createFileRoute("/_authenticated/analyze")({
  validateSearch: (search: Record<string, unknown>): { idea?: string } => {
    const value = search["idea"];
    return typeof value === "string" && value.trim().length > 0 ? { idea: value.trim() } : {};
  },
  head: () => ({ meta: [{ title: "Idea Analysis — FoundrLens AI" }, { name: "description", content: "Analyze and validate your startup idea." }, { property: "og:title", content: "Idea Analysis — FoundrLens AI" }, { property: "og:description", content: "Analyze and validate your startup idea." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AnalyzePage,
});

const sections: { title: string; key: keyof IdeaAnalysis }[] = [
  {title:"Problem being solved",key:"problem"}, {title:"Target customers",key:"customers"},
  {title:"Strengths",key:"strengths"}, {title:"Risks and weaknesses",key:"risks"},
  {title:"Competitors to research",key:"competitors_to_research"}, {title:"Monetization options",key:"monetization"}, {title:"MVP recommendations",key:"mvp"},
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
  const [audience,setAudience] = useState(""); const [problem,setProblem] = useState(""); const [market,setMarket] = useState("");
  const [analysisId,setAnalysisId] = useState<string|null>(null);
  async function run(value:string) {
    if(value.trim().length < 10){setError("Please describe your idea in at least 10 characters.");return;}
    setLoading(true);setError("");setResult(null);
    try {
      const extra=[audience&&`Target audience: ${audience}`,problem&&`Problem: ${problem}`,market&&`Market details: ${market}`].filter(Boolean).join("\n");
      const data=await api.analyze(extra?`${value.trim()}\n${extra}`:value.trim());
      data.idea=value.trim(); setResult(data); setRoadmap(null);
      const uid=await currentUserId();
      const { data:row, error:dbErr } = await supabase.from("analyses").insert({user_id:uid, idea:data.idea, result:data as any}).select("id").single();
      if(dbErr) toast.error("Analysis shown but not saved: "+dbErr.message); else setAnalysisId(row.id);
    }
    catch(e){setError(e instanceof Error?e.message:"Analysis failed. Please try again.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{if(idea) void run(idea);},[idea]);
  async function save(){
    if(!result)return;
    try{
      const uid=await currentUserId();
      const {data:exists}=await supabase.from("startups").select("id").eq("idea",result.idea).maybeSingle();
      if(exists){toast.info("Already in My Startups");return;}
      const {data:row,error}=await supabase.from("startups").insert({user_id:uid,idea:result.idea,summary:result.summary}).select("id").single();
      if(error)throw error;
      if(analysisId) await supabase.from("analyses").update({startup_id:row.id}).eq("id",analysisId);
      toast.success("Saved to My Startups");
    }catch(e){toast.error(e instanceof Error?e.message:"Could not save");}
  }
  async function makeRoadmap(){
    if(!result)return;
    setRoadmapLoading(true);setError("");
    try{
      const plan=await api.roadmap(result.idea); setRoadmap(plan);
      const uid=await currentUserId();
      const {error}=await supabase.from("roadmaps").insert({user_id:uid,idea:result.idea,plan});
      if(error) toast.error("Roadmap shown but not saved: "+error.message); else toast.success("Roadmap saved — track it under Roadmaps");
    }catch(e){setError(e instanceof Error?e.message:"Could not create roadmap");}
    finally{setRoadmapLoading(false);}
  }
  return <div className="min-h-screen bg-background"><Navbar/><main className="mx-auto w-full max-w-[880px] px-4 pb-24 pt-10 sm:px-6">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5"/>Back to home</Link>
    <div className="mt-6"><h1 className="text-2xl font-semibold tracking-tight text-foreground">Startup Idea Analysis</h1><p className="mt-2 text-sm text-muted-foreground">Get a structured first-pass assessment from your local AI model. Treat estimates as hypotheses to validate.</p></div>
    <form className="mt-6 rounded-[10px] border border-border bg-card p-4" onSubmit={e=>{e.preventDefault();void run(draft);}}>
      <label htmlFor="idea" className="text-sm font-medium text-foreground">Describe your startup idea</label>
      <textarea id="idea" value={draft} onChange={e=>setDraft(e.target.value)} rows={4} placeholder="Who has the problem, what is the problem, and how will your solution help?" className="mt-2 w-full resize-y rounded-md border border-input bg-background p-3 text-sm text-foreground outline-none focus:border-primary"/>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {([["Target audience",audience,setAudience,"e.g. college students in India"],["Problem",problem,setProblem,"What pain do they feel today?"],["Market details",market,setMarket,"Region, pricing, alternatives…"]] as const).map(([l,v,set,ph])=><label key={l} className="text-xs text-muted-foreground">{l} <span className="text-tertiary">(optional)</span><input value={v} onChange={e=>set(e.target.value)} maxLength={500} placeholder={ph} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"/></label>)}
      </div>
      <button disabled={loading||draft.trim().length<10} className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{loading?<Loader2 className="size-4 animate-spin"/>:<Sparkles className="size-4"/>}{loading?"Analyzing with Gemma…":"Analyze my idea"}</button>
    </form>
    {error&&<div role="alert" className="mt-4 flex gap-2 rounded-md border border-warning/30 bg-card p-3 text-sm text-muted-foreground"><AlertCircle className="size-4 shrink-0 text-warning"/>{error}</div>}
    {result&&<>
      <section className="mt-7 rounded-[10px] border border-primary/30 bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-medium uppercase tracking-wide text-primary">AI assessment · {result.model}</span><span className="text-sm text-muted-foreground">Initial score: <strong className="text-foreground">{result.score}/10</strong>{result.confidence&&<> · Confidence: <strong className="text-foreground capitalize">{result.confidence}</strong></>}</span></div><h2 className="mt-3 text-lg font-semibold text-foreground">{result.verdict}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.summary}</p><button onClick={save} className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"><BookmarkPlus className="size-4"/>Save to My Startups</button></section>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{sections.map(s=>{const value=result[s.key];return <section key={s.key} className="rounded-[10px] border border-border bg-card p-5"><h3 className="text-sm font-semibold text-foreground">{s.title}</h3>{Array.isArray(value)?<ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted-foreground">{value.map((v,i)=><li key={i}>{v}</li>)}</ul>:<p className="mt-3 text-sm leading-relaxed text-muted-foreground">{String(value??"")}</p>}</section>;})}</div>
      <div className="mt-7 rounded-[10px] border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-foreground">30-day startup roadmap</h2><p className="mt-1 text-xs text-muted-foreground">A validation-first plan generated for this idea.</p></div><button disabled={roadmapLoading} onClick={()=>void makeRoadmap()} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-foreground disabled:opacity-50">{roadmapLoading?<Loader2 className="size-4 animate-spin"/>:<Sparkles className="size-4"/>}{roadmapLoading?"Building plan…":"Generate roadmap"}</button></div>{roadmap&&<div className="mt-4"><RoadmapView plan={roadmap} completed={[]}/></div>}</div>
      <p className="mt-5 text-xs leading-relaxed text-tertiary">AI output is a starting point, not market research or professional advice. Competitor names, demand, pricing and legal requirements must be independently verified.</p>
    </>}
    <EconomicTimes/>
  </main></div>;
}
