import { supabase } from "@/integrations/supabase/client";
import { API_URL } from "./api-config";
import { relayAiRequest, relayBackendHealth } from "./backend-transport.functions";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (path !== "/api/health") {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error("Please sign in again before using the AI features.");
    headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }
  if (!(options?.body instanceof FormData) && !headers.has("Content-Type") && options?.body) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: options?.signal ?? AbortSignal.timeout(200_000) });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") throw new Error("The AI backend took too long to respond. Please try again.");
    if (options?.signal?.aborted) throw error;
    // Browser CORS failures cannot be repaired from the frontend. Relay only
    // transport failures through our own origin; keep the same backend contract.
    const form = new FormData();
    form.set("path", path);
    if (options?.body instanceof FormData) {
      const file = options.body.get("file");
      if (file instanceof File) form.set("file", file);
    } else if (typeof options?.body === "string") form.set("body", options.body);
    const result = path === "/api/health" ? await relayBackendHealth() : await relayAiRequest({ data: form });
    response = new Response(JSON.stringify(result.data), { status: result.status, headers: { "Content-Type": "application/json" } });
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : undefined;
    throw new Error(detail || `AI backend request failed (${response.status}). Check FastAPI and the Cloudflare Tunnel.`);
  }
  if (data === null) throw new Error("The AI backend returned a non-JSON response. Check the Cloudflare Tunnel and FastAPI address.");
  return data as T;
}

export interface IdeaAnalysis {
  idea: string; summary: string; problem: string; customers: string[]; strengths: string[];
  risks: string[]; competitors_to_research: string[]; mvp: string[];
  validation_questions: string[]; next_steps: string[]; assumptions: string[];
  verdict: string; score: number; model: string; monetization?: string[]; confidence?: string;
}
export const api = {
  health: () => request<{status:string; model:string; model_available:boolean; message?:string}>("/api/health"),
  analyze: (idea: string) => request<IdeaAnalysis>("/api/analyze", { method:"POST", body:JSON.stringify({idea}) }),
  roadmap: (idea: string) => request<Record<string, any>>("/api/roadmap", { method:"POST", body:JSON.stringify({idea}) }),
  chat: (message: string, history: {role:"user"|"assistant";content:string}[]) => request<{reply:string;model:string}>("/api/chat", {method:"POST",body:JSON.stringify({message,history})}),
  extract: (file: File) => { const form = new FormData(); form.append("file", file); return request<{text:string;filename:string}>("/api/eligibility/extract", {method:"POST",body:form}); },
  eligibility: (profile:string, requirements:string) => request<Record<string, any>>("/api/eligibility", {method:"POST",body:JSON.stringify({profile,requirements})}),
};
