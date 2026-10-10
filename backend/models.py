"""Request / response shapes for the professor chat API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

MAX_MESSAGE_CHARS = 1500
MAX_HISTORY_TURNS = 16


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=6000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)
    history: list[ChatMessage] = Field(default_factory=list, max_length=60)


class ChatResponse(BaseModel):
    professor: str
    reply: str
    tools_used: list[str] = []


class ProfessorInfo(BaseModel):
    slug: str
    name: str
    has_persona: bool
    courses: list[str]
