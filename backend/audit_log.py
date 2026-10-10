"""Append each chat turn to output/audit_log.json (a JSON list). No secrets, no full transcripts."""

from __future__ import annotations

import json
import re
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

AUDIT_PATH = Path(__file__).resolve().parent / "output" / "audit_log.json"
MAX_LOGGED_CHARS = 300
_LOCK = threading.Lock()

# Anything shaped like an API key / bearer token is masked before it hits disk.
_SECRET_RE = re.compile(r"(sk-[A-Za-z0-9_\-]{8,}|pk-[A-Za-z0-9_\-]{8,}|Bearer\s+\S+|[A-Za-z0-9+/=_\-]{40,})")


def redact(text: str) -> str:
    text = _SECRET_RE.sub("[REDACTED]", text)
    return text if len(text) <= MAX_LOGGED_CHARS else text[:MAX_LOGGED_CHARS] + "…"


def log_turn(path: Path = AUDIT_PATH, **record: Any) -> None:
    entry = {"timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"), **record}
    with _LOCK:
        path.parent.mkdir(parents=True, exist_ok=True)
        try:
            entries = json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            entries = []
        except json.JSONDecodeError:
            # Never wipe a damaged log: set it aside and start a new one.
            path.rename(path.with_suffix(f".corrupt-{datetime.now():%Y%m%d%H%M%S}.json"))
            entries = []
        entries.append(entry)
        path.write_text(json.dumps(entries, indent=2, ensure_ascii=False), encoding="utf-8")
