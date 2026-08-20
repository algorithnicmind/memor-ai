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
uv run aerich upgrade        # apply DB migrations
uv run uvicorn app.main:app --reload --port 8000
```

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
