from __future__ import annotations
import json, os
from typing import Any
import httpx
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://127.0.0.1:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'gemma4:e2b')
app = FastAPI(title='FoundrLens AI API', version='1.0.0')
origins = list(dict.fromkeys([
    'https://pixel-perfect-replay-32250.lovable.app',
    'https://id-preview--ebae88fd-9732-4db5-aea2-8bc803e04a1e.lovable.app',
    *[x.strip().rstrip('/') for x in os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://localhost:4173,http://localhost:8080').split(',') if x.strip()],
]))
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

class IdeaRequest(BaseModel):
    idea: str = Field(min_length=10, max_length=5000)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    history: list[dict[str, str]] = Field(default_factory=list)

class EligibilityRequest(BaseModel):
    profile: str = Field(min_length=3, max_length=5000)
    requirements: str = Field(min_length=3, max_length=12000)

async def ollama_chat(messages: list[dict[str, str]], json_mode: bool = False) -> str:
    payload: dict[str, Any] = {'model': OLLAMA_MODEL, 'messages': messages, 'stream': False, 'options': {'temperature': 0.25}}
    if json_mode: payload['format'] = 'json'
    try:
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(f'{OLLAMA_URL}/api/chat', json=payload)
            response.raise_for_status()
            return response.json()['message']['content']
    except httpx.ConnectError as exc:
        raise HTTPException(503, 'Ollama is not running. Start Ollama and run: ollama pull ' + OLLAMA_MODEL) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(504, 'The local model took too long. Try a shorter prompt or a smaller model.') from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(502, f'Ollama returned an error: {exc.response.text[:300]}') from exc

@app.get('/api/health')
async def health():
    try:
        async with httpx.AsyncClient(timeout=4) as client:
            r = await client.get(f'{OLLAMA_URL}/api/tags'); r.raise_for_status()
            models = [m.get('name') for m in r.json().get('models', [])]
        return {'status': 'ok', 'model': OLLAMA_MODEL, 'model_available': OLLAMA_MODEL in models, 'models': models}
    except Exception:
        return {'status': 'degraded', 'model': OLLAMA_MODEL, 'model_available': False, 'message': 'Ollama is not reachable'}

@app.post('/api/analyze')
async def analyze(req: IdeaRequest):
    prompt = '''You are FoundrLens, a careful startup analyst helping an early-stage founder. Analyze the idea below. Do not invent market statistics, competitor facts, customer interviews, or evidence. Mark uncertain statements as assumptions and suggest how to validate them. Return ONLY valid JSON with these keys: summary (string), problem (string), customers (array of strings), strengths (array), risks (array), competitors_to_research (array of strings; say categories/names to investigate, don't claim exhaustive research), mvp (array of strings), validation_questions (array of strings), next_steps (array of strings), assumptions (array of strings), monetization (array of strings), confidence (string: low, medium or high, reflecting how much depends on unverified assumptions), verdict (string), score (integer 1-10). Be practical and specific.\nIDEA: ''' + req.idea
    raw = await ollama_chat([{'role':'system','content':'Return valid JSON only. No markdown fences.'},{'role':'user','content':prompt}], True)
    try: data = json.loads(raw)
    except json.JSONDecodeError: raise HTTPException(502, 'The model returned an unreadable analysis. Please retry.')
    data['idea'] = req.idea
    data['model'] = OLLAMA_MODEL
    return data

@app.post('/api/roadmap')
async def roadmap(req: IdeaRequest):
    prompt = f"""Create a realistic 30-day validation-first startup roadmap for this idea: {req.idea}
Return ONLY JSON with keys: goal (string), week_1, week_2, week_3, week_4 (each an object with focus (string), tasks (array of 3-5 strings), days (array of 7 objects with day (integer 1-30) and task (string)), deliverable (string)), success_metrics (array of strings), risks (array of strings). Assume a student founder with a small budget and limited time. Prioritize customer discovery and validation before building too much. Do not claim results have already happened."""
    raw = await ollama_chat([{'role':'system','content':'Return valid JSON only.'},{'role':'user','content':prompt}], True)
    try: return json.loads(raw)
    except json.JSONDecodeError: raise HTTPException(502, 'The model returned an unreadable roadmap. Please retry.')

@app.post('/api/chat')
async def chat(req: ChatRequest):
    history = [{'role': m['role'], 'content': m['content'][:5000]} for m in req.history[-12:] if m.get('role') in ('user','assistant') and isinstance(m.get('content'), str)]
    messages = [{'role':'system','content':'You are FoundrLens AI, a grounded and encouraging startup co-founder for students and first-time founders. Give actionable, concise advice. Ask clarifying questions when needed. Never fabricate live grants, deadlines, market numbers, or legal/financial certainty; explain how to verify them.'}, *history, {'role':'user','content':req.message}]
    return {'reply': await ollama_chat(messages), 'model': OLLAMA_MODEL}

@app.post('/api/eligibility')
async def eligibility(req: EligibilityRequest):
    prompt = f'''Compare the founder profile with the opportunity requirements. Do not guess missing facts. Return JSON with: status (exactly one of "Eligible", "Potentially eligible", "Ineligible", "Insufficient information"), match_score (integer 0-100), matched (array of strings, each quoting the requirement text from the document and the profile fact that satisfies it), missing (array), concerns (array), questions_to_confirm (array), disclaimer (string). Distinguish explicit requirements from assumptions. Use \"Insufficient information\" when the profile or document lacks the facts needed. Never claim eligibility without quoted evidence.\nPROFILE:\n{req.profile}\nREQUIREMENTS:\n{req.requirements}'''
    raw = await ollama_chat([{'role':'system','content':'Return valid JSON only.'},{'role':'user','content':prompt}], True)
    try: return json.loads(raw)
    except json.JSONDecodeError: raise HTTPException(502, 'The model returned an unreadable eligibility result. Please retry.')

@app.post('/api/eligibility/extract')
async def extract_document(file: UploadFile = File(...)):
    if file.size and file.size > 8 * 1024 * 1024: raise HTTPException(413, 'File must be smaller than 8 MB.')
    name = (file.filename or '').lower()
    content = await file.read()
    if name.endswith('.txt'):
        text = content.decode('utf-8', errors='replace')
    elif name.endswith('.pdf'):
        try:
            from pypdf import PdfReader
            import io
            reader = PdfReader(io.BytesIO(content))
            text = '\n'.join(page.extract_text() or '' for page in reader.pages[:30])
        except ImportError: raise HTTPException(501, 'PDF support is not installed. Run pip install pypdf.')
        except Exception as exc: raise HTTPException(400, f'Could not read PDF: {exc}')
    else: raise HTTPException(415, 'Upload a PDF or TXT file.')
    if not text.strip(): raise HTTPException(400, 'No selectable text found. For scanned PDFs, copy the requirements into the text box.')
    return {'text': text[:12000], 'filename': file.filename}
