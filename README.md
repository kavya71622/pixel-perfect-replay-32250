# FoundrLens AI

FoundrLens is a local-first AI co-founder prototype. It uses the existing React + TanStack Start frontend and a Python FastAPI backend connected to Ollama. No cloud API key is required for local inference.

## What works in this build

- **Idea Analyzer:** sends an idea to your local Gemma model and renders a structured assessment.
- **AI Co-Founder:** multi-turn chat with the local model.
- **Eligibility Checker:** paste official criteria or upload a text-based PDF/TXT, then compare against your profile. Scanned PDFs need OCR/copy-paste.
- **My Startups:** save and remove analyzed ideas using browser local storage.
- **Opportunity Explorer:** the existing entries are explicitly sample placeholders, not real opportunities. Replace them with verified organizer links before presenting them as live opportunities.

Saved ideas are browser-local. Authentication, cloud sync, verified live opportunity ingestion, and production deployment are not configured in this starter.

## Requirements

- Windows 11 (also works on macOS/Linux)
- Node.js 20+ and npm
- Python 3.10+
- Ollama installed and running

## 1. Start the local AI model

Install Ollama from https://ollama.com/download, open PowerShell, then run:

```powershell
ollama pull gemma4:e2b
ollama run gemma4:e2b
```

Keep Ollama running. If this model tag is unavailable in your Ollama library, check `ollama list` and update `OLLAMA_MODEL` in `backend/.env` to the exact model tag you pulled.

## 2. Start the Python backend

Open a **second** PowerShell window in the project folder:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that window, then activate again. API health: http://127.0.0.1:8000/api/health. Interactive API docs: http://127.0.0.1:8000/docs.

## 3. Start the website

Open a **third** PowerShell window at the project root:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open the exact localhost URL printed in the terminal. The Vite port may vary if the default is occupied. If the browser origin is not listed in `backend/.env` under `CORS_ORIGINS`, add it and restart the backend.

## Troubleshooting

### Connected Cloudflare backend

The shared frontend service now defaults to `https://bloomberg-prayer-passport-usd.trycloudflare.com`. `VITE_API_URL` can override it; this is a public address, not a secret. No Lovable Cloud auth/database variables need changing. Temporary Cloudflare tunnel URLs change when a new tunnel is created; update the public address when that happens.

Existing calls are unchanged: `GET /api/health`, `POST /api/analyze` and `/api/roadmap` with `{idea}`, `POST /api/chat` with `{message, history}`, `POST /api/eligibility` with `{profile, requirements}`, and multipart `POST /api/eligibility/extract` with a `file` field. Every AI/file request forwards the signed-in user's access token as `Authorization: Bearer …`; health is public. Saved results still use the existing private Lovable Cloud account tables and file bucket.

If a browser transport/CORS failure prevents direct access, the shared service retries through a same-origin authenticated server function. The relay uses the same configured tunnel, accepts only existing AI paths, and forwards the verified user's bearer header. It does not retry HTTP errors or switch AI providers. Public health has a separate relay. The actual embedded preview origin is `https://ebae88fd-9732-4db5-aea2-8bc803e04a1e.lovableproject.com`; include this exact origin in your local FastAPI CORS list and restart it to restore direct preview access. The relay works without changing your local backend.

Apply the updated `backend/main.py` to your locally running FastAPI copy and restart it. Its CORS configuration always includes the published website and Lovable preview origins, including when `CORS_ORIGINS` overrides local origins. Keep FastAPI, Ollama, and Cloudflare Tunnel running. To apply the equivalent configuration in another backend copy, include `https://pixel-perfect-replay-32250.lovable.app` and the preview origin from `backend/.env.example`, allow `POST`/`GET`/`OPTIONS` and `Authorization`/`Content-Type` headers, then restart FastAPI.

The supplied Python API currently does not validate access tokens. Forwarding a bearer token does not protect public endpoints by itself; enforce token verification in your running backend before treating it as access-controlled. Never send a service-role key to the frontend or this API. These source updates cannot restart or modify FastAPI on your computer automatically.

- **Backend unreachable:** make sure the FastAPI window is running and `.env` in the project root has `VITE_API_URL=http://127.0.0.1:8000`.
- **Ollama not reachable:** run `ollama serve` in a separate terminal if Ollama is not already running.
- **Model unavailable:** run `ollama list`; set `OLLAMA_MODEL` to an installed tag in `backend/.env`, then restart FastAPI.
- **Slow response:** local inference can take time, especially on first load. Try a shorter idea or a smaller model supported by your Ollama installation.
- **PDF extraction:** only text-based PDFs are supported. Scanned image PDFs need OCR or pasted text.

## Security and deployment

This setup is intended for local development. Do not expose Ollama's port (11434) or this unauthenticated development API directly to the public internet. Before deploying, add authentication, request limits, secure CORS origins, HTTPS, secret management, and a hosted inference/backend setup. Never put Supabase service-role keys or other secrets in frontend environment variables.
