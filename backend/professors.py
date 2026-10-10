"""One PydanticAI agent per Yale SOM professor, built from the course database.

Each professor's instructions = prompts/base.md filled with their courses and bio from
data/yale_som.db, plus a speaking style from personas/<slug>.md (or _default.md).
All agents share one set of database tools. Agents are built on first use and cached.

Model: gpt-6-luna via Portkey (PORTKEY_API_KEY in .env). Override with OPENAI_MODEL.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic_ai import Agent, RunContext, UsageLimits
from pydantic_ai.messages import ModelMessage, ModelRequest, ModelResponse, TextPart, UserPromptPart
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.toolsets import FunctionToolset

import db
import materials
from models import ChatMessage

BACKEND_DIR = Path(__file__).resolve().parent
PROMPT_PATH = BACKEND_DIR / "prompts" / "base.md"
PERSONA_DIR = BACKEND_DIR / "personas"
PORTKEY_BASE_URL = "https://api.portkey.ai/v1"
DEFAULT_MODEL = "gpt-6-luna"
MAX_REQUESTS = 8

# .env may live in backend/, the repo root, or the class folder above it. Never committed.
for env in (BACKEND_DIR / ".env", BACKEND_DIR.parent / ".env", BACKEND_DIR.parent.parent / ".env"):
    load_dotenv(env)


@dataclass
class ProfState:
    slug: str
    tools_used: list[str] = field(default_factory=list)


# ---------------------------------------------------------------- shared tools


def search_courses(
    ctx: RunContext[ProfState], query: str = "", category: str = "", session: str = "", faculty: str = ""
) -> dict:
    """Search Yale SOM Fall 2026 courses.

    Args:
        query: keywords that must all appear (title, description, faculty, number), e.g. "regression".
        category: e.g. "Finance", "Core", "Economics".
        session: "fall" (full term), "fall-1" (first half) or "fall-2" (second half).
        faculty: part of a professor's name.
    """
    ctx.deps.tools_used.append("search_courses")
    rows = db.search_courses(query, category, session, faculty)
    return {"total": len(rows), "courses": rows[: db.MAX_RESULTS]}


def get_course(ctx: RunContext[ProfState], course_number: str) -> list[dict]:
    """Full details (description, schedule, room, instructor) for a course number like "MGT 403"."""
    ctx.deps.tools_used.append("get_course")
    return db.get_course(course_number)


def courses_taught_by(ctx: RunContext[ProfState], professor_name: str) -> dict:
    """List the courses a professor teaches this term. Accepts part of a name, e.g. "Kelly"."""
    ctx.deps.tools_used.append("courses_taught_by")
    matches = db.find_faculty(professor_name)[:5]
    return {name: db.courses_taught_by(name) for name in matches}


def search_course_materials(ctx: RunContext[ProfState], query: str) -> list[dict]:
    """Search your own private lecture notes for a topic. Returns matching excerpts (may be empty)."""
    ctx.deps.tools_used.append("search_course_materials")
    return materials.search(ctx.deps.slug, query)


TOOLS = FunctionToolset([search_courses, get_course, courses_taught_by, search_course_materials])


# ---------------------------------------------------------------- professors


def _persona(slug: str) -> tuple[str | None, str]:
    """(faculty name from front matter, style text) for personas/<slug>.md."""
    path = PERSONA_DIR / f"{slug}.md"
    if not path.is_file():
        return None, (PERSONA_DIR / "_default.md").read_text(encoding="utf-8").strip()
    text = path.read_text(encoding="utf-8")
    m = re.match(r"---\s*\nfaculty:\s*(.+?)\s*\n---\s*\n", text)
    return (m.group(1) if m else None), text[m.end():].strip() if m else text.strip()


def _slug(faculty: str) -> str:
    last, _, first = faculty.partition(",")
    return re.sub(r"[^a-z0-9]+", "-", f"{last}-{first}".lower()).strip("-")


@lru_cache(maxsize=1)
def registry() -> dict[str, str]:
    """slug -> faculty name. Persona files claim short slugs (e.g. 'zaman'); others use last-first."""
    reg = {_slug(f): f for f in db.all_faculty()}
    for path in PERSONA_DIR.glob("*.md"):
        if path.stem.startswith("_"):
            continue
        faculty, _ = _persona(path.stem)
        if faculty in reg.values():
            reg = {s: f for s, f in reg.items() if f != faculty}
            reg[path.stem] = faculty
    return reg


def has_persona(slug: str) -> bool:
    return (PERSONA_DIR / f"{slug}.md").is_file()


def instructions_for(slug: str) -> str:
    faculty = registry()[slug]
    courses = db.courses_taught_by(faculty)
    seen: dict[str, dict] = {}
    for c in courses:
        seen.setdefault(c["course_number"], c)
    lines = []
    for num, c in seen.items():
        sections = [x for x in courses if x["course_number"] == num]
        rooms = sorted({x["room"] for x in sections if x["room"]})
        sessions = sorted({x["course_session"] for x in sections if x["course_session"]})
        lines.append(
            f"  - {num} {c['course_title']} ({'/'.join(sessions)}, {c['units']} units, "
            f"{len(sections)} sections; room: {', '.join(rooms) or 'TBA'})"
        )
    _, persona = _persona(slug)
    values = {
        "{name}": db.display_name(faculty),
        "{courses}": "\n".join(lines) or "  - (no courses listed this term)",
        "{bio}": "  " + (db.faculty_bio(faculty) or "(no bio on file)"),
        "{persona}": persona,
    }
    text = PROMPT_PATH.read_text(encoding="utf-8")
    for k, v in values.items():
        text = text.replace(k, v)
    return text


@lru_cache(maxsize=None)
def agent_for(slug: str) -> Agent[ProfState, str]:
    """Build (once) the PydanticAI agent for one professor."""
    return Agent(
        name=slug,
        deps_type=ProfState,
        instructions=instructions_for(slug),
        toolsets=[TOOLS],
    )


def _make_client_and_model() -> tuple[AsyncOpenAI, OpenAIResponsesModel]:
    api_key = os.getenv("PORTKEY_API_KEY")
    if not api_key:
        raise RuntimeError("PORTKEY_API_KEY is not set — add it to .env")
    client = AsyncOpenAI(
        api_key="unused",
        base_url=PORTKEY_BASE_URL,
        default_headers={"x-portkey-api-key": api_key, "x-portkey-provider": "openai"},
    )
    model = OpenAIResponsesModel(
        os.getenv("OPENAI_MODEL") or DEFAULT_MODEL, provider=OpenAIProvider(openai_client=client)
    )
    return client, model


def _history(messages: list[ChatMessage]) -> list[ModelMessage]:
    out: list[ModelMessage] = []
    for m in messages:
        if m.role == "user":
            out.append(ModelRequest(parts=[UserPromptPart(content=m.content)]))
        else:
            out.append(ModelResponse(parts=[TextPart(content=m.content)]))
    return out


async def chat(slug: str, message: str, history: list[ChatMessage] | None = None) -> dict[str, Any]:
    """One chat turn with a professor -> {reply, tools_used}."""
    client, model = _make_client_and_model()
    state = ProfState(slug=slug)
    async with client:
        result = await agent_for(slug).run(
            message,
            model=model,
            deps=state,
            message_history=_history(history or []),
            usage_limits=UsageLimits(request_limit=MAX_REQUESTS),
        )
    return {"reply": result.output, "tools_used": state.tools_used}
