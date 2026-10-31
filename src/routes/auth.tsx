import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Focus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function safePath(v: unknown) {
  if (typeof v !== "string") return undefined;
  try {
    const u = new URL(v, "http://x");
    return u.pathname.startsWith("/") && !u.pathname.startsWith("//") ? u.pathname + u.search : undefined;
  } catch {
    return undefined;
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: safePath(s["redirect"]) }),
  head: () => ({
    meta: [
      { title: "Sign in — FoundrLens AI" },
      { name: "description", content: "Sign in to save your startup analyses, roadmaps and chats." },
      { property: "og:title", content: "Sign in — FoundrLens AI" },
      { property: "og:description", content: "Sign in to save your startup analyses, roadmaps and chats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() || undefined } },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: redirect ?? "/my-startups", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-border bg-card">
            <Focus className="size-4 text-primary" />
          </span>
          <span className="text-lg font-semibold text-foreground">FoundrLens</span>
        </Link>
        <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold text-foreground">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your analyses, roadmaps and chats are private to you.</p>
          {mode === "signup" && (
            <label className="mt-5 block text-sm text-foreground">Name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={input} /></label>
          )}
          <label className="mt-4 block text-sm text-foreground">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="email" /></label>
          <label className="mt-4 block text-sm text-foreground">Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          {notice && <p className="mt-3 text-sm text-primary">{notice}</p>}
          <button disabled={busy} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Sign up"}
          </button>
          <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
