# MASTER TODO

## Phase 1: Foundation & Setup
- [x] Initialize Next.js 16 project with React 19, Tailwind CSS v4, and Radix UI.
- [x] Setup Framer Motion for premium UI interactions.
- [x] Initialize FastAPI project with Pydantic and `msgspec` for ultra-fast serialization.
- [ ] Implement JWT Authentication flow.
- [x] Create basic Chat UI (Frontend) and `/chat` endpoint (Backend) - No memory yet.
- [x] Configure `openai` SDK to point to Mistral API (`mistral-small-latest`).

## Phase 2: Core Memory Engine & Embedded Databases
- [x] Setup `google-genai` for generating 768-dim embeddings (`text-embedding-004`).
- [x] Implement custom SQLite Vector Store (table schema + cosine similarity logic).
- [x] Setup embedded Kuzu Graph DB for entity relationship mapping.
- [x] Develop `Memory Extractor` logic using Mistral function calling to parse structured JSON (e.g., Decision context).
- [x] Build `Duplicate Detection` module using MD5 content hashing.

## Phase 3: Dual Retrieval System
- [x] Implement Vector Search (SQLite) for semantic queries.
- [x] Implement Graph Search (Kuzu) for entity traversal.
- [ ] Integrate `rank-bm25` to re-rank graph search results based on textual relevance.
- [ ] Build `Context Builder` to merge SQLite vectors and Kuzu graph results into the final Mistral prompt.

## Phase 4: Frontend Integration & UI Polish
- [ ] Connect full pipeline: Message -> Extract -> Retrieve -> Context -> LLM -> Response.
- [ ] Build Memory Panel in the Chat UI.
- [ ] Build dedicated Memory Dashboard page (view, edit, delete memories).
- [ ] Ensure markdown rendering works flawlessly with `react-markdown` and `remark-gfm`.

## Phase 5: Testing & Optimization
- [ ] Write Test Case 1: Basic memory recall.
- [ ] Write Test Case 2: Cross-session memory recall.
- [ ] Write Test Case 3: Decision context preservation.
- [ ] Write Test Case 4: Graph reasoning (multi-hop traversal).
- [ ] Measure latency and ensure sub-500ms retrieval times.
