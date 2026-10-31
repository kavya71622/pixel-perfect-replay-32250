import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { forwardBackend } from "./backend-transport.server";

export const relayAiRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData) || data.get("path") === "/api/health") throw new Error("Invalid AI request.");
    return data;
  })
  .handler(({ data }) => forwardBackend(data, getRequestHeader("authorization")));

export const relayBackendHealth = createServerFn({ method: "GET" }).handler(() => {
  const form = new FormData();
  form.set("path", "/api/health");
  return forwardBackend(form);
});