"""Offline tests for the professor back end: database tools, agents, safety limits, audit trail.

No API calls: professors.chat is replaced with fakes. Run from backend/:  python -m pytest -q
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic_ai.exceptions import ModelHTTPError, UsageLimitExceeded

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

import audit_log  # noqa: E402
import db  # noqa: E402
import main  # noqa: E402
import materials  # noqa: E402
import professors  # noqa: E402
from models import MAX_HISTORY_TURNS, MAX_MESSAGE_CHARS  # noqa: E402


@pytest.fixture
def audit_path(tmp_path, monkeypatch):
    path = tmp_path / "audit_log.json"
    real = audit_log.log_turn
    monkeypatch.setattr(main, "log_turn", lambda **r: real(path=path, **r))
    return path


@pytest.fixture
def client(monkeypatch):
    main._hits.clear()
    return TestClient(main.app)


def fake_chat(reply="Yo! The CLT says averages get bell-shaped.", seen=None):
    async def run(slug, message, history):
        if seen is not None:
            seen.append((slug, message, history))
        return {"reply": reply, "tools_used": ["search_courses"]}

    return run


# ---------------------------------------------------------------- database (read-only)


def test_database_is_read_only():
    with pytest.raises(Exception):
        with db._connect() as con:
            con.execute("DELETE FROM courses")


def test_zaman_teaches_mgt409_in_evans_2200():
    rooms = {c["room"] for c in db.courses_taught_by("Zaman, Tauhid") if c["room"]}
    assert rooms == {"EVANS 2200"}


def test_search_is_parameterized_against_injection():
    assert db.search_courses("' OR 1=1 --") == []
    assert len(db.search_courses()) > 100  # sanity: the table is still there


def test_search_and_lookup():
    assert all("Finance" in c["course_category"] for c in db.search_courses(category="Finance"))
    assert db.get_course("mgt409") == db.get_course("MGT 409")
    assert db.find_faculty("Zaman") == ["Zaman, Tauhid"]


def test_no_faculty_emails_in_database():
    with db._connect() as con:
        assert con.execute("SELECT COUNT(*) FROM courses WHERE faculty_1_email <> ''").fetchone()[0] == 0


# ---------------------------------------------------------------- professor agents


def test_every_professor_gets_an_agent_slug():
    reg = professors.registry()
    assert len(reg) == len(db.all_faculty())
    assert reg["zaman"] == "Zaman, Tauhid"


def test_zaman_prompt_has_courses_bio_persona_and_rules():
    text = professors.instructions_for("zaman")
    assert "MGT 409" in text and "EVANS 2200" in text
    assert "Operations Management" in text  # bio from the database
    assert "yo" in text.lower()  # persona
    assert "not the real professor" in text and "graded assignment" in text
    assert "{" not in text  # every placeholder filled


def test_professor_without_persona_uses_default_style():
    slug = next(s for s in professors.registry() if not professors.has_persona(s))
    text = professors.instructions_for(slug)
    assert "warm, engaging Yale SOM professor" in text


def test_materials_stay_inside_professor_folder(tmp_path, monkeypatch):
    (tmp_path / "zaman").mkdir()
    (tmp_path / "zaman" / "notes.md").write_text("# CORS\nCORS lets the API say this front end may use me.", encoding="utf-8")
    (tmp_path / "secret.md").write_text("CORS secret outside the folder", encoding="utf-8")
    monkeypatch.setattr(materials, "MATERIALS_DIR", tmp_path)
    hits = materials.search("zaman", "what is CORS")
    assert hits and all("secret" not in h["text"] for h in hits)
    assert materials.search("../", "CORS") == []
    assert materials.search("nobody", "CORS") == []


# ---------------------------------------------------------------- API safety


def test_unknown_professor_is_404(client, audit_path):
    assert client.post("/api/professors/dumbledore/chat", json={"message": "hi"}).status_code == 404


def test_rejects_empty_oversized_and_bad_roles(client, monkeypatch, audit_path):
    monkeypatch.setattr(professors, "chat", fake_chat())
    url = "/api/professors/zaman/chat"
    assert client.post(url, json={"message": ""}).status_code == 422
    assert client.post(url, json={"message": "x" * (MAX_MESSAGE_CHARS + 1)}).status_code == 422
    assert client.post(url, json={"message": "hi", "history": [{"role": "system", "content": "x"}]}).status_code == 422
    assert not audit_path.exists()


def test_only_recent_history_reaches_the_agent(client, monkeypatch, audit_path):
    seen = []
    monkeypatch.setattr(professors, "chat", fake_chat(seen=seen))
    history = [{"role": "user" if i % 2 == 0 else "assistant", "content": f"turn {i}"} for i in range(40)]
    client.post("/api/professors/zaman/chat", json={"message": "hi", "history": history})
    assert len(seen[0][2]) == MAX_HISTORY_TURNS and seen[0][2][-1].content == "turn 39"


def test_rate_limit(client, monkeypatch, audit_path):
    monkeypatch.setattr(professors, "chat", fake_chat())
    codes = [client.post("/api/professors/zaman/chat", json={"message": "hi"}).status_code for _ in range(main.RATE_LIMIT + 1)]
    assert codes[:-1] == [200] * main.RATE_LIMIT and codes[-1] == 429


def test_errors_never_leak_details(client, monkeypatch, audit_path):
    async def boom(slug, message, history):
        raise RuntimeError("PORTKEY_API_KEY=pk-secret-value-123456 rejected")

    monkeypatch.setattr(professors, "chat", boom)
    res = client.post("/api/professors/zaman/chat", json={"message": "hi"})
    assert res.status_code == 502 and "secret" not in res.text
    assert "secret" not in audit_path.read_text(encoding="utf-8")


def test_content_filter_and_request_limit(client, monkeypatch, audit_path):
    async def filtered(slug, message, history):
        raise ModelHTTPError(400, "gpt-6-luna", {"code": "content_filter"})

    async def too_many(slug, message, history):
        raise UsageLimitExceeded("request_limit")

    monkeypatch.setattr(professors, "chat", filtered)
    assert client.post("/api/professors/zaman/chat", json={"message": "x"}).status_code == 400
    monkeypatch.setattr(professors, "chat", too_many)
    assert client.post("/api/professors/zaman/chat", json={"message": "x"}).status_code == 429
    statuses = [e["status"] for e in json.loads(audit_path.read_text(encoding="utf-8"))]
    assert statuses == ["blocked", "stopped"]


def test_successful_turn_is_logged(client, monkeypatch, audit_path):
    monkeypatch.setattr(professors, "chat", fake_chat())
    body = client.post("/api/professors/zaman/chat", json={"message": "explain the CLT"}).json()
    assert body["reply"].startswith("Yo")
    entry = json.loads(audit_path.read_text(encoding="utf-8"))[-1]
    assert entry["status"] == "ok" and entry["professor"] == "zaman" and entry["tools_used"] == ["search_courses"]


def test_professor_list(client):
    profs = {p["slug"]: p for p in client.get("/api/professors?persona_only=true").json()}
    assert set(profs) == {"schott", "zaman"}
    assert profs["zaman"]["name"] == "Tauhid Zaman" and profs["zaman"]["courses"] == ["MGT 409"]
    assert profs["schott"]["name"] == "Peter Schott" and profs["schott"]["courses"] == ["MGT 407"]


def test_schott_prompt_has_emba_stats_research_and_style():
    text = professors.instructions_for("schott")
    assert "MGT 407 Statistics" in text  # course from the database
    assert "Juan Trippe Professor" in text  # bio from the database
    assert "Surprisingly Swift Decline" in text and "Totoro" in text  # persona + research
    assert "{" not in text
