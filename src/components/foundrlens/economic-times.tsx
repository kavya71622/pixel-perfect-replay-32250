import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEconomicTimes } from "@/lib/economic-times.functions";
import type { MarketResult } from "@/lib/economic-times";

export function EconomicTimes() {
  const fetchMarket = useServerFn(getEconomicTimes);
  const [exchange, setExchange] = useState<"NSE" | "BSE">("NSE");
  const [result, setResult] = useState<Extract<MarketResult, { status: "completed" }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingJob, setPendingJob] = useState<string | null>(null);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);

  async function load() {
    const runId = ++generation.current;
    setLoading(true); setError("");
    try {
      let response = await fetchMarket({ data: pendingJob ? { operation: "poll", jobId: pendingJob } : { operation: "start", exchange } });
      for (let attempt = 0; response.status === "processing" && attempt < 60; attempt++) {
        if (runId !== generation.current) return;
        const jobId = response.jobId;
        setPendingJob(jobId);
        await new Promise(resolve => setTimeout(resolve, response.status === "processing" ? response.retryAfterMs : 2000));
        if (runId !== generation.current) return;
        response = await fetchMarket({ data: { operation: "poll", jobId } });
      }
      if (runId !== generation.current) return;
      if (response.status === "completed") { setResult(response); setPendingJob(null); }
      else if (response.status === "failed") { setError(response.error); setPendingJob(null); }
      else setError("Anakin is still processing this request. Check again shortly.");
    } catch (e) {
      if (runId === generation.current) setError(e instanceof Error ? e.message : "Could not retrieve Economic Times data.");
    } finally {
      if (runId === generation.current) setLoading(false);
    }
  }

  return <section aria-labelledby="economic-times-heading" className="mt-8 border-t border-border pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="economic-times-heading" className="text-base font-semibold text-foreground">Economic Times · Advance / Decline</h2><p className="mt-1 text-xs text-muted-foreground">Via Anakin · 2 credits per new request</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="et-exchange" className="text-xs text-muted-foreground">Exchange</label>
        <select id="et-exchange" value={exchange} disabled={loading || !!pendingJob} onChange={e => { setExchange(e.target.value === "BSE" ? "BSE" : "NSE"); setResult(null); setError(""); }} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground">
          <option value="NSE">NSE</option><option value="BSE">BSE</option>
        </select>
        <Button variant="outline" disabled={loading} onClick={() => void load()}>
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          {loading ? "Fetching…" : pendingJob ? "Check result" : result ? "Refresh data" : "Fetch market data"}
        </Button>
      </div>
    </div>
    {error && <p role="alert" className="mt-4 break-words text-sm text-warning">{error}</p>}
    {result && <>
      <p className="mt-4 text-xs text-muted-foreground">{result.exchange} · {result.rows.length} records · Retrieved {new Date(result.retrievedAt).toLocaleString()}</p>
      {result.rows.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No market records returned.</p> : <div className="mt-3 max-h-96 overflow-auto rounded-md border border-border">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-card text-muted-foreground"><tr>{["Index", "Value", "Change %", "Advances", "Declines", "No change"].map(label => <th key={label} className="whitespace-nowrap px-3 py-3 font-medium">{label}</th>)}</tr></thead>
          <tbody>{result.rows.map((row, index) => <tr key={index} className="border-t border-border text-foreground">
            <td className="min-w-32 px-3 py-3 font-medium">{row.index_name}</td><td className="whitespace-nowrap px-3 py-3 tabular-nums">{row.current.toLocaleString()}</td><td className="px-3 py-3 tabular-nums">{row.change_pct}%</td><td className="px-3 py-3 tabular-nums">{row.advances}</td><td className="px-3 py-3 tabular-nums">{row.declines}</td><td className="px-3 py-3 tabular-nums">{row.no_change}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </>}
  </section>;
}