"""FastAPI back end: chat with AI professor characters from the 3D Evans Hall game.

Run:  cd backend && .venv/Scripts/uvicorn main:app --port 8001
Docs: http://127.0.0.1:8001/docs
"""

from __future__ import annotations

import logging
import os
import time
import uuid
from collections import defaultdict, deque
from datetime import date

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic_ai.exceptions import ModelHTTPError, UsageLimitExceeded

import db
import professors
from audit_log import log_turn, redact
from models import MAX_HISTORY_TURNS, ChatRequest, ChatResponse, ProfessorInfo

log = logging.getLogger("professors")

RATE_LIMIT = 20  # chat requests per client per window
RATE_WINDOW_S = 60
DAILY_LIMIT = int(os.getenv("DAILY_CHAT_LIMIT", "500"))  # all clients combined; caps model spend

app = FastAPI(title="Evans Hall professors")

# Which web pages may call this API: local dev servers, the GitHub Pages site, Render
# static sites, plus anything listed in ALLOWED_ORIGINS (comma-separated full origins).
ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+|https://sophiaruilin\.github\.io|https://[a-z0-9-]+\.onrender\.com",
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

_hits: dict[str, deque[float]] = defaultdict(deque)
_daily = {"day": date.today(), "count": 0}


def _client_ip(request: Request) -> str:
    # Behind Render's proxy every request comes from the proxy; the visitor is the first
    # address in X-Forwarded-For.
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _daily_cap_reached() -> bool:
    today = date.today()
    if _daily["day"] != today:
        _daily.update(day=today, count=0)
    if _daily["count"] >= DAILY_LIMIT:
        return True
    _daily["count"] += 1
    return False


def _rate_limited(client: str) -> bool:
    now = time.monotonic()
    q = _hits[client]
    while q and now - q[0] > RATE_WINDOW_S:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        return True
    q.append(now)
    return False


@app.get("/api/health")
def health():
    return {"ok": True, "professors": len(professors.registry())}


@app.get("/api/professors", response_model=list[ProfessorInfo])
def list_professors(persona_only: bool = False):
    out = []
    for slug, faculty in sorted(professors.registry().items()):
        if persona_only and not professors.has_persona(slug):
            continue
        courses = sorted({c["course_number"] for c in db.courses_taught_by(faculty)})
        out.append(ProfessorInfo(slug=slug, name=db.display_name(faculty), has_persona=professors.has_persona(slug), courses=courses))
    return out


@app.post("/api/professors/{slug}/chat", response_model=ChatResponse)
async def chat(slug: str, body: ChatRequest, request: Request):
    if slug not in professors.registry():
        raise HTTPException(404, "No professor by that name.")
    if _rate_limited(_client_ip(request)):
        raise HTTPException(429, "Whoa, that's a lot of questions. Give it a minute and try again.")
    if _daily_cap_reached():
        raise HTTPException(429, "The professors are done with office hours for today. Come back tomorrow!")

    run_id = uuid.uuid4().hex[:8]
    started = time.perf_counter()
    history = body.history[-MAX_HISTORY_TURNS:]
    record = {"run_id": run_id, "professor": slug, "message": redact(body.message), "history_turns": len(history)}
    try:
        result = await professors.chat(slug, body.message, history)
    except ModelHTTPError as e:
        if "content_filter" in str(e.body):
            log_turn(**record, status="blocked", stop_reason="content_filter", elapsed_s=_since(started))
            raise HTTPException(400, "I can't help with that one. Ask me about courses, concepts, or Yale SOM.")
        log.exception("chat run %s failed", run_id)
        log_turn(**record, status="error", error=f"ModelHTTPError {e.status_code}", elapsed_s=_since(started))
        raise HTTPException(502, "The professor is unavailable right now. Please try again.")
    except UsageLimitExceeded:
        log_turn(**record, status="stopped", stop_reason="request_limit", elapsed_s=_since(started))
        raise HTTPException(429, "That question needed too many steps. Try asking something narrower.")
    except Exception as e:
        # Log the error type only; SDK messages can include request details.
        log.exception("chat run %s failed", run_id)
        log_turn(**record, status="error", error=type(e).__name__, elapsed_s=_since(started))
        raise HTTPException(502, "The professor is unavailable right now. Please try again.")

    log_turn(**record, status="ok", tools_used=result["tools_used"], reply_chars=len(result["reply"]), elapsed_s=_since(started))
    return ChatResponse(professor=slug, reply=result["reply"], tools_used=result["tools_used"])


def _since(started: float) -> float:
    return round(time.perf_counter() - started, 2)
