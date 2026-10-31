const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(options?.headers);
    if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(`Cannot reach FoundrLens backend at ${API_URL}. Start the Python API and check VITE_API_URL.`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Request failed (${response.status})`);
  return data as T;
}

export interface IdeaAnalysis {
  idea: string; summary: string; problem: string; customers: string[]; strengths: string[];
  risks: string[]; competitors_to_research: string[]; mvp: string[];
  validation_questions: string[]; next_steps: string[]; assumptions: string[];
  verdict: string; score: number; model: string;
}
export const api = {
  health: () => request<{status:string; model:string; model_available:boolean; message?:string}>("/api/health"),
  analyze: (idea: string) => request<IdeaAnalysis>("/api/analyze", { method:"POST", body:JSON.stringify({idea}) }),
  roadmap: (idea: string) => request<Record<string, any>>("/api/roadmap", { method:"POST", body:JSON.stringify({idea}) }),
  chat: (message: string, history: {role:"user"|"assistant";content:string}[]) => request<{reply:string;model:string}>("/api/chat", {method:"POST",body:JSON.stringify({message,history})}),
  extract: (file: File) => { const form = new FormData(); form.append("file", file); return request<{text:string;filename:string}>("/api/eligibility/extract", {method:"POST",body:form}); },
  eligibility: (profile:string, requirements:string) => request<Record<string, any>>("/api/eligibility", {method:"POST",body:JSON.stringify({profile,requirements})}),
};
