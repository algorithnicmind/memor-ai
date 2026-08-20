# MASTER TODO

The backend (Phases 1–3) is **implemented** and a smoke test
(`backend/scripts/smoke_test.py`) covers the happy path through every
domain. Phases 4–5 are the remaining frontend polish and systematic
testing.

## Phase 1: Foundation & Setup  ✅ done
- [x] Initialize Next.js 16 project with React 19, Tailwind CSS v4, and Radix UI.
- [x] Setup Framer Motion for premium UI interactions.
- [x] Initialize FastAPI project with `msgspec` for ultra-fast serialization. **No pydantic in our code** — pydantic only appears as `fastapi`'s transitive dep.
- [x] Implement JWT Authentication flow (`bcrypt>=4.2` + `pyjwt` HS256; `current_user` FastAPI dependency on every protected route).
- [x] Create basic Chat UI (Frontend) and `/chat` endpoint (Backend) — wired to memory pipeline.
- [x] Configure `openai` SDK to point to Mistral API (`mistral-large-latest` chat, `mistral-embed` 1024-dim embeddings). Swap provider by changing `OPENAI_COMPAT_*` env vars.

## Phase 2: Core Memory Engine & Embedded Databases  ✅ done
- [x] Use `mistral-embed` (OpenAI-SDK-compatible) for **1024-dim** embeddings — not Gemini 768-dim.
- [x] Vector store on **Tortoise ORM** (`MemoryVector` model) with JSON-encoded vector + pure-Python cosine similarity.
- [x] Embedded **Ladybug** graph store (Cypher surface) for entity + `CONNECTED_TO` relation edges.
- [x] Memory Extractor logic using Mistral tool-calling to parse structured JSON (typed decisions, relations).
- [x] Conflict resolution is **semantic, not hash-based**: cosine similarity finds candidates; an LLM action-classifier returns `ADD` / `UPDATE` / `DELETE` / `NONE` per candidate before write.

## Phase 3: Dual Retrieval System  ✅ done
- [x] Vector Search (Tortoise/SQLite) for semantic queries — user-scoped via JWT subject.
- [x] Graph Search (Ladybug) for entity traversal — Cypher queries filtered by `user_id`.
- [x] `rank-bm25` re-ranking of graph results.
- [x] Context Builder merges SQLite vectors and Ladybug graph hits into the Mistral prompt.

## Phase 4: Frontend Integration & UI Polish  � in progress
- [ ] Connect full pipeline in the UI: Message → Extract → Retrieve → Context → LLM → Response with the JWT bearer.
- [ ] Build Memory Panel in the Chat UI (memory badges that influenced a response).
- [ ] Build dedicated Memory Dashboard page (view, edit, delete memories).
- [ ] Ensure markdown rendering works flawlessly with `react-markdown` and `remark-gfm`.
- [ ] Surface the typed-decision context (goal / constraints / alternatives / final_choice / reasoning) on the dashboard.

## Phase 5: Testing & Optimization  🔄 in progress
- [x] Backend smoke test (`backend/scripts/smoke_test.py`) — register → login → me → chat → recall → delete → cross-user isolation → logout.
- [ ] Write Test Case 1: Basic memory recall.
- [ ] Write Test Case 2: Cross-session memory recall.
- [ ] Write Test Case 3: Decision context preservation.
- [ ] Write Test Case 4: Graph reasoning (multi-hop traversal).
- [ ] Measure latency and ensure sub-500ms retrieval times.
