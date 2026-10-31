import { afterEach, describe, expect, it, vi } from "vitest";
import { marketRequestSchema, parseMarketResponse } from "@/lib/economic-times";
import { requestMarketData } from "@/lib/economic-times.server";

afterEach(() => vi.unstubAllGlobals());
describe("Economic Times integration", () => {
  it.each(["NSE", "BSE"] as const)("sends the supplied advance/decline action for %s", async exchange => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "processing", job_id: "c0a33ef7-c1c7-4e67-a5d4-c6ea45c03076" }), { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    await requestMarketData({ operation: "start", exchange }, { appKey: "test-app", connectionKey: "test-connection" });
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("No request sent");
    expect(call[0]).toBe("https://connector-gateway.lovable.dev/udc_anakin/v1/wire/task");
    expect(JSON.parse(call[1].body)).toEqual({ action_id: "et_advance_decline", params: { exchange } });
    expect(call[1].headers["X-Connection-Api-Key"]).toBe("test-connection");
  });
  it("rejects unsupported exchanges", () => {
    expect(marketRequestSchema.safeParse({ operation: "start", exchange: "unverified" }).success).toBe(false);
  });
  it("rejects arbitrary job paths", () => {
    expect(marketRequestSchema.safeParse({ operation: "poll", jobId: "../../identities" }).success).toBe(false);
  });
  it("preserves returned market counts and duplicate index records", () => {
    const row = { index_name: "Nifty 50", current: 23053.1, change: 116.35, change_pct: 0.51, advances: 29, declines: 21, no_change: 0 };
    const result = parseMarketResponse({ status: "completed", data: { status: "ok", data: { exchange: "NSE", data: [row, { ...row, advances: 39, declines: 11 }] } } });
    expect(result.status).toBe("completed");
    if (result.status !== "completed") throw new Error("No completed result");
    expect(result.rows.map(r => [r.advances, r.declines, r.no_change])).toEqual([[29, 21, 0], [39, 11, 0]]);
  });
  it("surfaces failed jobs", () => {
    expect(parseMarketResponse({ status: "failed", error: { code: "EXECUTION_FAILED" } })).toEqual({ status: "failed", error: 'Anakin task failed: {"code":"EXECUTION_FAILED"}' });
  });
  it("polls the documented job endpoint without submitting another task", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "processing" })));
    vi.stubGlobal("fetch", fetchMock);
    const jobId = "c0a33ef7-c1c7-4e67-a5d4-c6ea45c03076";
    expect(await requestMarketData({ operation: "poll", jobId }, { appKey: "test-app", connectionKey: "test-connection" })).toMatchObject({ status: "processing", jobId });
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("No poll sent");
    expect(call[0]).toBe(`https://connector-gateway.lovable.dev/udc_anakin/v1/wire/jobs/${jobId}`);
    expect(call[1].method).toBe("GET");
    expect(call[1].body).toBeNull();
  });
});