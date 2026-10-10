"""Keyword search over private course notes in backend/materials/ (git-ignored).

Drop .md or .txt files in materials/<professor-slug>/ (e.g. materials/zaman/lec07.md).
Only that professor's folder is searched, and the folder never leaves this machine.
"""

from __future__ import annotations

import re
from pathlib import Path

MATERIALS_DIR = Path(__file__).resolve().parent / "materials"
MAX_CHUNKS = 4
MAX_CHUNK_CHARS = 1200


def _chunks(text: str) -> list[str]:
    # Split on headings / blank lines so each chunk is one slide or section.
    parts = re.split(r"\n(?=#)|\n\s*\n", text)
    return [p.strip()[:MAX_CHUNK_CHARS] for p in parts if p.strip()]


def search(slug: str, query: str) -> list[dict[str, str]]:
    folder = (MATERIALS_DIR / slug).resolve()
    if not folder.is_dir() or MATERIALS_DIR.resolve() not in folder.parents:
        return []
    words = [w.lower() for w in re.findall(r"\w{3,}", query)][:10]
    if not words:
        return []
    scored = []
    for f in sorted(folder.glob("*")):
        if f.suffix.lower() not in {".md", ".txt"}:
            continue
        for chunk in _chunks(f.read_text(encoding="utf-8", errors="ignore")):
            low = chunk.lower()
            score = sum(low.count(w) for w in words)
            if score:
                scored.append((score, f.name, chunk))
    scored.sort(key=lambda s: -s[0])
    return [{"file": name, "text": chunk} for _, name, chunk in scored[:MAX_CHUNKS]]
