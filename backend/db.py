"""Read-only access to data/yale_som.db (Yale SOM Fall 2026 course listings).

Every query is parameterized and the file is opened read-only, so nothing a chat
message contains can change the database.
"""

from __future__ import annotations

import sqlite3
from functools import lru_cache
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "yale_som.db"
MAX_RESULTS = 12

SUMMARY_COLS = (
    "course_number, section, course_title, course_category, course_session, "
    "units, daytimes, room, faculty_1"
)


def _connect() -> sqlite3.Connection:
    con = sqlite3.connect(f"file:{DB_PATH.as_posix()}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con


def _clean(row: sqlite3.Row) -> dict[str, Any]:
    return {k: " ".join(str(row[k] or "").split()) for k in row.keys()}


def _query(sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    with _connect() as con:
        return [_clean(r) for r in con.execute(sql, params)]


def search_courses(query: str = "", category: str = "", session: str = "", faculty: str = "") -> list[dict[str, Any]]:
    """Every keyword must appear in the number, title, description, faculty, or category."""
    sql = f"SELECT {SUMMARY_COLS} FROM courses WHERE 1=1"
    params: list[str] = []
    for word in query.split()[:8]:
        sql += (
            " AND (course_number || ' ' || course_title || ' ' || course_description || ' ' ||"
            " faculty_1 || ' ' || course_category) LIKE ?"
        )
        params.append(f"%{word}%")
    if category:
        sql += " AND course_category LIKE ?"
        params.append(f"%{category}%")
    if session:
        sql += " AND course_session = ?"
        params.append(session)
    if faculty:
        sql += " AND faculty_1 LIKE ?"
        params.append(f"%{faculty}%")
    sql += " ORDER BY course_number, section"
    return _query(sql, tuple(params))


def get_course(course_number: str) -> list[dict[str, Any]]:
    """All sections of one course, e.g. 'MGT 409' (spacing and case don't matter)."""
    key = course_number.replace(" ", "").upper()
    return _query(
        "SELECT course_number, section, course_title, course_category, course_type, course_session, "
        "course_description, faculty_1, daytimes, room, units, syllabus "
        "FROM courses WHERE REPLACE(UPPER(course_number), ' ', '') = ? ORDER BY section",
        (key,),
    )


def courses_taught_by(faculty: str) -> list[dict[str, Any]]:
    return _query(f"SELECT {SUMMARY_COLS} FROM courses WHERE faculty_1 = ? ORDER BY course_number, section", (faculty,))


def find_faculty(name: str) -> list[str]:
    """Faculty names (stored as 'Last, First') matching part of a name."""
    rows = _query(
        "SELECT DISTINCT faculty_1 FROM courses WHERE faculty_1 <> '' AND faculty_1 LIKE ? ORDER BY faculty_1",
        (f"%{name}%",),
    )
    return [r["faculty_1"] for r in rows]


def faculty_bio(faculty: str) -> str:
    rows = _query(
        "SELECT faculty_bio FROM courses WHERE faculty_1 = ? AND faculty_bio <> '' LIMIT 1", (faculty,)
    )
    return rows[0]["faculty_bio"] if rows else ""


@lru_cache(maxsize=1)
def all_faculty() -> list[str]:
    rows = _query("SELECT DISTINCT faculty_1 FROM courses WHERE faculty_1 <> '' ORDER BY faculty_1")
    return [r["faculty_1"] for r in rows]


def display_name(faculty: str) -> str:
    """'Zaman, Tauhid' -> 'Tauhid Zaman'."""
    last, _, first = faculty.partition(",")
    return f"{first.strip()} {last.strip()}".strip()
