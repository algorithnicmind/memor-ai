# Technical Requirements Document (TRD)

## 1. System Overview
Memorai is an advanced AI chat application that solves memory loss between conversations using a dual-memory architecture combining Vector-based semantic memory and Knowledge graph storage.

## 2. Technology Stack

### 2.1. Frontend Technologies
- **Framework**: Next.js 16.1.1 (App Router, SSR)
- **React**: React 19.2.3 (Concurrent features)
- **Language**: TypeScript ^5
- **Styling**: Tailwind CSS ^4, `@tailwindcss/typography`
- **Animations**: Motion (Framer Motion) 12.23.26
- **UI Components**: Radix UI (Accessible primitives), Lucide React 0.562.0 (Icons)
- **Content Rendering**: `react-markdown` 10.1.0, `remark-gfm`

### 2.2. Backend Technologies
- **Framework**: FastAPI >= 0.115 (Python >= 3.12)
- **Server**: Uvicorn >= 0.34
- **Validation / Serialization**: `msgspec` >= 0.20 — sole DTO surface. **No pydantic in our code.** (`fastapi`'s own internals pull in pydantic as a transitive dep; that's the framework, not our contract.)
- **Package manager**: `uv` — `backend/pyproject.toml` is the source of truth; `uv.lock` is committed.

### 2.3. AI & Machine Learning Services
- **Provider**: any **OpenAI-SDK-compatible** endpoint. Defaults to Mistral (`https://api.mistral.ai/v1`). Swap to OpenAI / Groq / Together / local OpenAI-compat by changing `OPENAI_COMPAT_*` env vars.
- **Chat LLM**: `mistral-large-latest` (configurable via `OPENAI_COMPAT_CHAT_MODEL`), called via `openai` SDK >= 2.14.
- **Embeddings**: `mistral-embed` (configurable via `OPENAI_COMPAT_EMBED_MODEL`), **1024-dimensional** vectors (configurable via `EMBEDDING_DIMS`). Mistral rejects the `dimensions=` parameter on this model — dimensionality is fixed at the model level.
- **Text Ranking**: `rank-bm25` >= 0.2.2 — re-ranks graph traversal results.
- **Rate limiting**: per-client token buckets in-process (separate buckets for chat and embeddings, default 1.5 rps each — tuned below Mistral's free-tier 1 rps to absorb burst). Plus exponential-backoff retry on provider 429.

### 2.4. Database & Storage Layer (Embedded Architecture)
- **Vector + history storage**: **Tortoise ORM** on **SQLite** (`tortoise-orm[sqlite]` + `aerich` for migrations). Two models — `MemoryVector(id, collection, vector_json, payload_json, timestamps)` and `MemoryHistory(id, memory_id, old_memory, new_memory, event, is_deleted, timestamps)`. Cosine similarity is pure-Python over the JSON column.
- **Graph storage**: **Ladybug** >= 0.19 (Cypher surface, in-process embedded DB). Holds entity nodes + `CONNECTED_TO` edges; reuses the OpenAI-compatible chat client for entity / relation extraction via tool calls.
- **User store**: same Tortoise / SQLite — `User(id UUID, email unique, hashed_password, timestamps)`.
- **Metadata filtering**: every query is filtered by `user_id` (sourced from the JWT, never the request body) plus optional `agent_id` / `run_id`.

## 3. UI/UX Highlights
- Modern **Glass Morphism Design** with subtle gradients.
- **Dark/Light Theme Toggle** using `next-themes`.
- **Smooth Animations** powered by Motion.
- **Memory Badges** showing which memories influenced responses.
- **Typing Indicators** with animated dots.
- **Markdown Support** with syntax highlighting.

## 4. Performance Characteristics
- **Message + Memory Search**: ~500ms (Parallel embedding + search)
- **Memory Addition**: ~300ms (Async fact extraction)
- **Graph Search**: ~100ms (BM25 re-ranking)
- **Embedding Generation**: ~50–100ms (Mistral `mistral-embed` call, OpenAI-SDK-compatible)

## 5. Security & Privacy
- **Auth**: email + password registration. `bcrypt>=4.2` for hashing (direct API, no passlib). `pyjwt` HS256 access tokens with configurable TTL (`JWT_TTL_MINUTES`, default 30). Every protected route (`/api/chat`, `/api/memories/*`, `/auth/me`, `/auth/logout`) gated by a `current_user` FastAPI dependency that decodes the bearer token and fetches the `User`.
- **User Isolation**: Memories strictly filtered by `user_id`. The `user_id` is **always** read from the JWT subject claim — it is never accepted from request bodies, preventing cross-tenant forgery.
- **Local Storage**: All data stays local — SQLite via Tortoise ORM + Ladybug graph on the same host as the FastAPI server.
- **Input validation**: every request body decoded by `msgspec.json.decode` via a `msgspec_body(Req)` FastAPI dependency; malformed payloads fail with 422 before any handler runs.
