import { API_URL } from "./api-config";

const aiPaths = new Set(["/api/analyze", "/api/roadmap", "/api/chat", "/api/eligibility", "/api/eligibility/extract"]);

export async function forwardBackend(form: FormData, authorization?: string) {
  const path = form.get("path");
  if (typeof path !== "string" || (!aiPaths.has(path) && path !== "/api/health")) throw new Error("Unsupported AI request.");
  if (path !== "/api/health" && !authorization?.startsWith("Bearer ")) throw new Error("Please sign in again before using the AI features.");
  const headers = new Headers();
  if (authorization) headers.set("Authorization", authorization);
  let body: BodyInit | null = null;
  if (path === "/api/eligibility/extract") {
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 8 * 1024 * 1024) throw new Error("Upload a file smaller than 8 MB.");
    const upload = new FormData();
    upload.append("file", file);
    body = upload;
  } else if (path !== "/api/health") {
    const json = form.get("body");
    if (typeof json !== "string") throw new Error("Missing AI request body.");
    JSON.parse(json);
    headers.set("Content-Type", "application/json");
    body = json;
  }
  try {
    const response = await fetch(`${API_URL}${path}`, { method: path === "/api/health" ? "GET" : "POST", headers, body, signal: AbortSignal.timeout(200_000), redirect: "error" });
    return { status: response.status, data: await response.json().catch(() => null) };
  } catch (error) {
    return { status: error instanceof Error && error.name === "TimeoutError" ? 504 : 502, data: { detail: "The AI backend could not respond. Check FastAPI and the Cloudflare Tunnel, then try again." } };
  }
}