# Backend integration
- [x] Add Economic Times advance/decline data to Idea Analysis using the supplied Anakin action.
- [x] Connect Anakin securely and verify a real NSE response through the signed-in page.
- [x] Inspect existing AI calls and configure the tunnel URL.
- [x] Forward signed-in access tokens and update backend CORS source without changing API contracts.
- [x] Test service behavior and attempt the live connection; report external blockers.
- [ ] Verify live AI responses and deployed CORS: blocked by tunnel timeouts and the user's local FastAPI needing the updated source/restart.
- [ ] Verify signed-in AI responses and saved results: blocked by no existing auth user and the unreachable tunnel.