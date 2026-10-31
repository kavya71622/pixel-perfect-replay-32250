import { z } from "zod";

export const marketRequestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("start"), exchange: z.enum(["NSE", "BSE"]) }),
  z.object({ operation: z.literal("poll"), jobId: z.string().uuid() }),
]);
export type MarketRequest = z.infer<typeof marketRequestSchema>;
export interface MarketRow {
  index_name: string;
  current: number;
  change: number;
  change_pct: number;
  advances: number;
  declines: number;
  no_change: number;
}
const rowSchema = z.object({
  index_name: z.string(), current: z.number(), change: z.number(), change_pct: z.number(),
  advances: z.number(), declines: z.number(), no_change: z.number(),
});
const resultSchema = z.object({
  status: z.literal("ok"),
  data: z.object({ exchange: z.string(), data: z.array(rowSchema) }),
});
export type MarketResult =
  | { status: "processing"; jobId: string; retryAfterMs: number }
  | { status: "completed"; exchange: string; rows: MarketRow[]; retrievedAt: string }
  | { status: "failed"; error: string };

export function parseMarketResponse(input: unknown): MarketResult {
  const job = z.object({
    status: z.string(), job_id: z.string().optional(), retry_after_ms: z.number().optional(),
    data: z.unknown().optional(), error: z.unknown().optional(),
  }).parse(input);
  if (job.status === "processing" || job.status === "pending" || job.status === "queued") {
    const jobId = z.string().uuid().parse(job.job_id);
    return { status: "processing", jobId, retryAfterMs: Math.max(1000, Math.min(job.retry_after_ms ?? 2000, 10000)) };
  }
  if (job.status === "failed") {
    return { status: "failed", error: `Anakin task failed: ${JSON.stringify(job.error ?? "No details provided")}` };
  }
  if (job.status !== "completed") throw new Error("Anakin returned an unexpected task status.");
  const result = resultSchema.parse(job.data);
  return { status: "completed", exchange: result.data.exchange, rows: result.data.data, retrievedAt: new Date().toISOString() };
}