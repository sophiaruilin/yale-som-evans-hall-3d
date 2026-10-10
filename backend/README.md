# Professor agents (FastAPI + PydanticAI)

Chat with AI professor characters inside the Evans Hall game. Every Yale SOM professor in `data/yale_som.db` gets a PydanticAI agent. Each agent's prompt combines that professor's courses and bio from the database, a shared set of teaching and safety rules (`prompts/base.md`), and an optional speaking style (`personas/<slug>.md`).

**Local only.** The game on GitHub Pages is static, so chat works when you run this back end on your machine.

## Run

```bash
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # macOS/Linux: .venv/bin/pip
.venv/Scripts/uvicorn main:app --port 8001
```

Put `PORTKEY_API_KEY` in a `.env` file: `backend/.env`, the repo root, or the folder above it. These files are git-ignored. The default model is `gpt-6-luna` via Portkey; set `OPENAI_MODEL` to change it. Then run the game with `npm run dev`, walk up to Prof. Zaman in room 2200, aim at him, and click.

## Pieces

| File | Role |
|---|---|
| `main.py` | API routes: `GET /api/professors`, `POST /api/professors/{slug}/chat`, plus rate limit, errors, and audit log |
| `professors.py` | Agent factory: one cached agent per professor, all sharing the same tools |
| `db.py` | Read-only, parameterized queries on `data/yale_som.db` |
| `materials.py` | Search private lecture notes in `materials/<slug>/` (git-ignored) |
| `personas/` | Speaking styles. `zaman.md` is done; add one file per professor |
| `tests/` | Offline tests, no API calls: `.venv/Scripts/python -m pytest -q` |

## Adding a professor persona

Create `personas/<slug>.md`:

```markdown
---
faculty: Last, First
---
How they talk...
```

The `faculty` value must match the name in the database exactly. The slug becomes their chat ID.

## Safety

- **Character, not the real person:** characters are AI tributes. They never speak for the real professor on grades, extensions, exams, or policies.
- **No graded answers:** they coach instead of handing out answers to graded work.
- **Input limits:** messages up to 1,500 characters, the last 16 turns sent to the model, and 20 chats per minute per client.
- **Bounded agent runs:** at most 8 model calls per turn.
- **Read-only data:** the database is opened read-only and every query is parameterized.
- **Untrusted content:** tool results and notes are treated as data, never as instructions.
- **Clean errors:** error responses never include exception text. The provider's content filter is reported as a polite refusal.
- **Audit log:** each turn is logged to `output/audit_log.json` (git-ignored) with key-like strings masked and messages cut to 300 characters.
- **Local network only:** CORS allows localhost only, and uvicorn binds to 127.0.0.1.

The game's AI-Zaman character is shown with Prof. Zaman's OK.
