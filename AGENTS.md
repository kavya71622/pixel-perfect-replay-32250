<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- AI calls go to the user's own FastAPI/Ollama backend (`backend/`, reached via `VITE_API_URL`); do not swap in a paid AI provider without the user's consent.
- Keep the public API address in `src/lib/api-config.ts` with a `VITE_API_URL` override; all AI requests use the shared browser service and the current user's bearer token, so endpoint contracts and account storage remain unchanged.
- On browser transport failures, use an authenticated same-origin server-function relay to the fixed shared backend URL; whitelist existing AI paths and forward the verified caller's bearer header, never accept an arbitrary upstream URL. Health alone has a public relay.
- Signed-in pages live under `src/routes/_authenticated/`; user data is read/written from the browser client with per-user RLS (`user_id = auth.uid()`), and eligibility files go to the private `eligibility-docs` bucket under `<user_id>/`.
- Economic Times market data uses an authenticated server function and the Anakin connector gateway, with browser-driven polling of validated job IDs; this keeps connector credentials private and avoids long-running server requests.
