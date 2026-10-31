import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
const { relayAiRequest, relayBackendHealth } = vi.hoisted(() => ({ relayAiRequest: vi.fn(), relayBackendHealth: vi.fn() }));
vi.mock("@/lib/backend-transport.functions", () => ({ relayAiRequest, relayBackendHealth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession } } }));
import { api } from "@/lib/api";
import { API_URL } from "@/lib/api-config";

describe("FastAPI integration", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ reply: "Test reply", model: "gemma4:e2b" })));
    getSession.mockReset();
    getSession.mockResolvedValue({ data: { session: { access_token: "test-user-token" } }, error: null });
    relayAiRequest.mockReset();
    relayBackendHealth.mockReset();
  });

  it("uses the provided Cloudflare tunnel by default", () => {
    expect(API_URL).toBe("https://sunny-setup-copying-leon.trycloudflare.com");
  });

  it.each([
    ["/api/analyze", () => api.analyze("A student startup idea"), { idea: "A student startup idea" }],
    ["/api/roadmap", () => api.roadmap("A student startup idea"), { idea: "A student startup idea" }],
    ["/api/chat", () => api.chat("What next?", [{ role: "user", content: "My idea" }]), { message: "What next?", history: [{ role: "user", content: "My idea" }] }],
    ["/api/eligibility", () => api.eligibility("Student founder", "Students only"), { profile: "Student founder", requirements: "Students only" }],
  ] as const)("preserves %s and forwards the signed-in token", async (path, call, payload) => {
    await call();
    expect(fetchMock).toHaveBeenCalledOnce();
    const callArgs = fetchMock.mock.calls[0];
    if (!callArgs) throw new Error("Expected a backend request");
    const [url, options] = callArgs;
    expect(url).toBe(`${API_URL}${path}`);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(payload);
    expect(options.headers.get("Authorization")).toBe("Bearer test-user-token");
    expect(options.headers.get("Content-Type")).toBe("application/json");
  });

  it("preserves authenticated multipart extraction without a JSON content type", async () => {
    const file = new File(["Students only"], "criteria.txt", { type: "text/plain" });
    await api.extract(file);
    const callArgs = fetchMock.mock.calls[0];
    if (!callArgs) throw new Error("Expected an extraction request");
    const [url, options] = callArgs;
    expect(url).toBe(`${API_URL}/api/eligibility/extract`);
    expect(options.body.get("file")).toBe(file);
    expect(options.headers.get("Authorization")).toBe("Bearer test-user-token");
    expect(options.headers.has("Content-Type")).toBe(false);
  });

  it("does not send AI requests without a signed-in user", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(api.chat("Hello", [])).rejects.toThrow("Please sign in again");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("checks existing health endpoint without a token", async () => {
    await api.health();
    expect(getSession).not.toHaveBeenCalled();
    const callArgs = fetchMock.mock.calls[0];
    if (!callArgs) throw new Error("Expected a health request");
    const [url, options] = callArgs;
    expect(url).toBe(`${API_URL}/api/health`);
    expect(options.headers.has("Authorization")).toBe(false);
  });

  it("reports backend errors", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ detail: "Ollama is not running" }), { status: 503 }));
    await expect(api.chat("Hello", [])).rejects.toThrow("Ollama is not running");
  });

  it("rejects tunnel HTML instead of treating it as an AI result", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Tunnel unavailable</html>"));
    await expect(api.chat("Hello", [])).rejects.toThrow("non-JSON response");
  });

  it.each([
    ["/api/analyze", () => api.analyze("A student startup idea"), { idea: "A student startup idea" }],
    ["/api/roadmap", () => api.roadmap("A student startup idea"), { idea: "A student startup idea" }],
    ["/api/chat", () => api.chat("What next?", []), { message: "What next?", history: [] }],
    ["/api/eligibility", () => api.eligibility("Student founder", "Students only"), { profile: "Student founder", requirements: "Students only" }],
  ] as const)("relays %s with the unchanged payload when browser CORS blocks fetch", async (path, call, payload) => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    relayAiRequest.mockResolvedValue({ status: 200, data: { model: "gemma4:latest" } });
    expect(await call()).toEqual({ model: "gemma4:latest" });
    const form = relayAiRequest.mock.calls[0]?.[0].data;
    expect(form.get("path")).toBe(path);
    expect(JSON.parse(form.get("body"))).toEqual(payload);
    expect(form.has("authorization")).toBe(false);
  });

  it("relays multipart extraction without altering the file", async () => {
    const file = new File(["Students only"], "criteria.txt");
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    relayAiRequest.mockResolvedValue({ status: 200, data: { text: "Students only" } });
    await api.extract(file);
    expect(relayAiRequest.mock.calls[0]?.[0].data.get("file")).toBe(file);
  });

  it("relays public health separately when browser fetch fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    relayBackendHealth.mockResolvedValue({ status: 200, data: { status: "ok" } });
    expect(await api.health()).toEqual({ status: "ok" });
    expect(relayAiRequest).not.toHaveBeenCalled();
  });

  it("does not retry an HTTP error through the relay", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ detail: "Sign in again" }), { status: 401 }));
    await expect(api.chat("Hello", [])).rejects.toThrow("Sign in again");
    expect(relayAiRequest).not.toHaveBeenCalled();
  });
});