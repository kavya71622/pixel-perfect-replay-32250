import { marketRequestSchema, parseMarketResponse, type MarketRequest, type MarketResult } from "./economic-times";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/udc_anakin";

export async function requestMarketData(input: MarketRequest, credentials: { appKey: string; connectionKey: string }): Promise<MarketResult> {
  const data = marketRequestSchema.parse(input);
  const path = data.operation === "start" ? "/v1/wire/task" : `/v1/wire/jobs/${data.jobId}`;
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    method: data.operation === "start" ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${credentials.appKey}`,
      "X-Connection-Api-Key": credentials.connectionKey,
      "Content-Type": "application/json",
    },
    body: data.operation === "start" ? JSON.stringify({ action_id: "et_advance_decline", params: { exchange: data.exchange } }) : null,
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Anakin request failed [${response.status}]: ${errorBody}`);
    return { status: "failed", error: `Anakin request failed (${response.status}): ${errorBody}` };
  }
  const body: unknown = await response.json();
  // Some processing responses omit job_id when polling a known job.
  const result = data.operation === "poll" && body && typeof body === "object"
    ? { job_id: data.jobId, ...body } : body;
  return parseMarketResponse(result);
}