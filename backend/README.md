# Memorai Backend

FastAPI service for the Memorai memory engine. Stores typed memories
(simple facts, decisions, preferences, plans) per user, with vector
similarity search and a Kuzu knowledge graph.

## What it does

- Chat with an LLM that **remembers** what each user has said across
  sessions, weighted by similarity and graph relations.
- Four memory types — `simple`, `decision`, `preference`, `plan` — with
  rich context for decisions (goal, constraints, alternatives, final
  choice, reasoning, emotional state, confidence).
- Conflict-aware updates: when new info contradicts or supersedes
  existing memories, the engine updates or deletes them rather than
  appending duplicates.
- Vector similarity over an SQLite-backed cosine index, plus a Kuzu
  knowledge graph for entity–relation queries.

## Stack

- **FastAPI** for the HTTP layer.
- **msgspec** for validation / serialization — no pydantic in our
  code. (`fastapi`'s own internals use pydantic; that's a transitive
  dep, not in ours.)
- **Tortoise ORM + aerich** for the SQLite-backed vector and history
  stores, with versioned migrations.
- **Kuzu** for the embedded knowledge graph (entities + relations).
- **OpenAI-SDK-compatible** provider for both chat and embeddings.
  Defaults to Mistral — swap to OpenAI / Groq / Together by changing
  `OPENAI_COMPAT_*` env vars.
- **bcrypt + JWT** for auth (email + password).

## Setup

```bash
cd backend
uv sync
cp .env.example .env         # fill in OPENAI_COMPAT_API_KEY, JWT_SECRET, ...
uv run uvicorn app.main:app --reload --port 8000
# Tables (User, MemoryVector, MemoryHistory) are created automatically
# on first startup via Tortoise.generate_schemas().

## Layout

```
backend/
├── app/
│   ├── api/        # FastAPI routers (chat, memory, auth) + deps
│   ├── core/       # config (msgspec), logging
│   ├── domains/    # auth, chat, memory (business logic)
│   └── infrastructure/
│       ├── auth/       # bcrypt hashing, JWT issuer/verifier
│       ├── database/   # Tortoise models + repos + Kuzu graph
│       └── embeddings/ # OpenAI-SDK-compatible embedder
├── migrations/     # aerich versioned migrations
├── pyproject.toml
└── LICENSE         # MIT
```

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET`  | `/health`              | —    | health check |
| `POST` | `/auth/register`       | —    | create account, returns JWT |
| `POST` | `/auth/login`          | —    | exchange creds for JWT |
| `GET`  | `/auth/me`             | JWT  | current user |
| `POST` | `/auth/logout`         | JWT  | client drops token |
| `POST` | `/api/chat`            | JWT  | chat with memory |
| `GET`  | `/api/memories`        | JWT  | list current user's memories |
| `DELETE` | `/api/memories/{id}` | JWT  | delete one memory |
| `DELETE` | `/api/memories`      | JWT  | delete all for current user |

Open `http://localhost:8000/docs` for Swagger UI.

## Run notes / curl walkthrough

```bash
# 1. Health (no auth)
curl -s localhost:8000/health

# 2. Register
TOKEN=$(curl -s -X POST localhost:8000/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"a@b.c","password":"hunter22hunter22","name":"Alice"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# 3. Store a statement
curl -s -X POST localhost:8000/api/chat \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"message":"I chose Python over Go for ML work because of the ecosystem."}'

# 4. List memories (user_id comes from the JWT)
curl -s -H "authorization: Bearer $TOKEN" localhost:8000/api/memories

# 5. Recall — the LLM should reference Python + ecosystem
curl -s -X POST localhost:8000/api/chat \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"message":"Why did I pick my main language?"}'

# 6. No token → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8000/api/chat \
  -H 'content-type: application/json' \
  -d '{"message":"hi"}'

# 7. Delete one
curl -s -X DELETE -H "authorization: Bearer $TOKEN" \
  'localhost:8000/api/memories/<id>'
```

## Smoke test

With the server running on `localhost:8000`:

```bash
uv run python scripts/smoke_test.py
```

Covers register → login → me → chat (store) → list → chat (recall) →
delete → cross-user isolation → logout. Exits non-zero on the first
failure.

## Provider switch

Both chat and embeddings go through the same `AsyncOpenAI` client
configured by:

| Env var | Default | Notes |
|---|---|---|
| `OPENAI_COMPAT_BASE_URL` | `https://api.mistral.ai/v1` | Any OpenAI-SDK-compatible URL |
| `OPENAI_COMPAT_API_KEY`  | (required) | Provider key |
| `OPENAI_COMPAT_CHAT_MODEL` | `mistral-large-latest` | |
| `OPENAI_COMPAT_EMBED_MODEL` | `mistral-embed` | |
| `EMBEDDING_DIMS` | `1024` | Match the embed model |

Swap to OpenAI / Groq / Together / etc. by editing the four vars —
no code change.
