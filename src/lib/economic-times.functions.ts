import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { marketRequestSchema, type MarketRequest, type MarketResult } from "./economic-times";

export const getEconomicTimes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: MarketRequest) => marketRequestSchema.parse(input))
  .handler(async ({ data }): Promise<MarketResult> => {
    const appKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["UDC_ANAKIN_API_KEY"];
    if (!appKey || !connectionKey) return { status: "failed", error: "Connect Anakin before requesting Economic Times data." };
    try {
      const { requestMarketData } = await import("./economic-times.server");
      return await requestMarketData(data, { appKey, connectionKey });
    } catch (error) {
      console.error("Economic Times request could not complete", error);
      return { status: "failed", error: "Economic Times data could not be retrieved. Please try again." };
    }
  });