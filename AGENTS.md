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
- Signed-in pages live under `src/routes/_authenticated/`; user data is read/written from the browser client with per-user RLS (`user_id = auth.uid()`), and eligibility files go to the private `eligibility-docs` bucket under `<user_id>/`.
