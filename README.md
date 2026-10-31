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

- **Backend unreachable:** make sure the FastAPI window is running and `.env` in the project root has `VITE_API_URL=http://127.0.0.1:8000`.
- **Ollama not reachable:** run `ollama serve` in a separate terminal if Ollama is not already running.
- **Model unavailable:** run `ollama list`; set `OLLAMA_MODEL` to an installed tag in `backend/.env`, then restart FastAPI.
- **Slow response:** local inference can take time, especially on first load. Try a shorter idea or a smaller model supported by your Ollama installation.
- **PDF extraction:** only text-based PDFs are supported. Scanned image PDFs need OCR or pasted text.

## Security and deployment

This setup is intended for local development. Do not expose Ollama's port (11434) or this unauthenticated development API directly to the public internet. Before deploying, add authentication, request limits, secure CORS origins, HTTPS, secret management, and a hosted inference/backend setup. Never put Supabase service-role keys or other secrets in frontend environment variables.
