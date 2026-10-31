import { beforeEach, describe, expect, it, vi } from "vitest";
import { forwardBackend } from "@/lib/backend-transport.server";

describe("fixed-destination backend relay", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ reply: "Gemma reply" })));
  });
  it("rejects arbitrary upstream paths", async () => {
    const form = new FormData(); form.set("path", "https://untrusted.example");
    await expect(forwardBackend(form, "Bearer test-user-token")).rejects.toThrow("Unsupported");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("rejects AI requests without a caller token", async () => {
    const form = new FormData(); form.set("path", "/api/chat");
    await expect(forwardBackend(form)).rejects.toThrow("sign in again");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("forwards the user token and unchanged JSON only to the configured tunnel", async () => {
    const form = new FormData(); form.set("path", "/api/chat"); form.set("body", JSON.stringify({ message: "Hello", history: [] }));
    await forwardBackend(form, "Bearer test-user-token");
    const args = fetchMock.mock.calls[0];
    expect(args?.[0]).toBe("https://bloomberg-prayer-passport-usd.trycloudflare.com/api/chat");
    expect(args?.[1].headers.get("Authorization")).toBe("Bearer test-user-token");
    expect(JSON.parse(args?.[1].body)).toEqual({ message: "Hello", history: [] });
    expect(args?.[1].redirect).toBe("error");
  });
  it("reports Cloudflare HTML as an upstream error", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 }));
    const form = new FormData(); form.set("path", "/api/health");
    const result = await forwardBackend(form);
    expect(result.status).toBe(502);
    expect(result.data.detail).toContain("Cloudflare Tunnel");
  });
});