# Low-Level Design (LLD)

## 1. Database Schemas (Tortoise ORM / SQLite)

All persistent state lives in SQLite via Tortoise ORM. The same SQLite
file (`backend/data/memorai.db`) holds three tables; migrations live
under `backend/migrations/` and are applied with `aerich upgrade`.

### `users` table — auth
- `id` (UUID, primary key)
- `email` (string, unique, indexed)
- `hashed_password` (string — `bcrypt>=4.2` cost, default 12 rounds)
- `name` (string, nullable)
- `created_at` / `updated_at` (timestamp)

### `memoryvectors` table — vector store
- `id` (UUID, primary key)
- `collection` (string, indexed — e.g. `"memories"`)
- `vector_json` (text — JSON-encoded list of floats, dimension
  configurable via `EMBEDDING_DIMS`, default **1024** for Mistral
  `mistral-embed`)
- `payload_json` (text — JSON metadata: `memory_type`, `user_id`,
  `agent_id?`, `run_id?`, `importance`, `confidence`, `created_at`)
- `created_at` / `updated_at` (timestamp)
- Cosine similarity is computed in pure Python over the decoded JSON
  vector after fetching the row set; a per-user filter is applied in
  SQL (`user_id`) before the Python similarity pass.

### `memoryhistories` table — audit log
- `id` (UUID, primary key)
- `memory_id` (UUID, indexed — references the affected vector row)
- `old_memory` (text, nullable)
- `new_memory` (text, nullable)
- `event` (string — `"ADD"`, `"UPDATE"`, `"DELETE"`, `"NONE"`)
- `is_deleted` (bool)
- `created_at` / `updated_at` (timestamp)

## 2. Graph Schema (Ladybug)

Ladybug is an embedded property-graph store with the Cypher query
surface. Nodes and edges are scoped per user via `user_id` on every
Cypher parameter.

### `Entity` node
- `id` (UUID)
- `user_id` (string — owner, filter)
- `agent_id` / `run_id` (strings, optional)
- `name` (string — entity name)
- `entity_type` (string — `person`, `tool`, `project`, …)
- `mentions` (int — counter; bumps each time the entity is referenced)
- `created_at` / `updated_at` (timestamp)

### `CONNECTED_TO` relationship (edge)
- `name` (string — relationship label, e.g. `"uses"`, `"decided_on"`)
- `mentions` (int — counter to strengthen relationships over time)
- `created_at` / `updated_at` (timestamp)

Note: vectors in Ladybug are not used at the storage layer in the
current build — semantic similarity is served by the
`memoryvectors` SQLite table. The graph is for entity–relation
traversal only.

## 3. Decision Memory Schema
For decisions, Memorai captures full context using this exact structure:
```json
{
  "decision_id": "decision_2026_01_04_abc123",
  "goal": "Choose a programming language",
  "constraints": ["limited time", "need job market viability"],
  "alternatives": ["Python", "JavaScript", "Go"],
  "final_choice": "Python",
  "reasoning": "Strong AI/ML ecosystem",
  "emotional_state": "excited but overwhelmed",
  "confidence": 0.85
}
```

This shape is what `extraction_prompts.STRUCTURED_FACT_EXTRACTION_PROMPT`
asks the LLM to return when `memory_type == "decision"`. The memory
service persists it inside `memoryvectors.payload_json`.

## 4. API Endpoints

All endpoints except `/health`, `/auth/register`, `/auth/login` require
`Authorization: Bearer <jwt>`. The JWT subject claim is the source of
truth for `user_id` — bodies never carry `user_id`.

### Auth
- **`POST /auth/register`** → `{email, password, name?}` →
  `201 {access_token, token_type, expires_in, user}`.
  Email format-checked; password ≥ 8 chars; uniqueness enforced.
- **`POST /auth/login`** → `{email, password}` →
  `200 {access_token, token_type, expires_in, user}`.
- **`GET /auth/me`** (auth required) → `200 {id, email, name, created_at}`.
- **`POST /auth/logout`** (auth required) → `204`.
  Stateless — client drops the token.

### Chat
- **`POST /api/chat`** (auth required) → `{message, system_prompt?}` →
  `200 {response, memories_used: [...], relations_used: [...]}`.
  Memory pipeline: vector search + graph traversal → BM25 rerank →
  context assembly → chat completion → structured fact extract →
  vector/graph write.

### Memories
- **`GET /api/memories`** (auth required) → `200 [Memory, ...]` —
  the calling user's memories only.
- **`GET /api/memories/{id}`** (auth required) → `200 Memory` or `404`.
- **`GET /api/memories/{id}/history`** (auth required) →
  `200 [HistoryEntry, ...]` (audit log).
- **`DELETE /api/memories/{id}`** (auth required) → `204` or `404`.
  Cross-user deletion returns `404` (no existence leak).
- **`DELETE /api/memories`** (auth required) → `204` — wipes the
  calling user's memories only.

### Health
- **`GET /health`** → `200 {status: "ok"}` — no auth.

### Example: `POST /api/chat`
**Request:**
```json
{
  "message": "I'm learning Python for AI development"
}
```
**Response:**
```json
{
  "response": "That's great! Since you mentioned earlier...",
  "memories_used": [
    {
      "id": "mem_abc123",
      "memory": "User is interested in machine learning",
      "memory_type": "preference",
      "score": 0.89
    }
  ],
  "relations_used": [
    {
      "source": "<user_id>",
      "relationship": "learning",
      "destination": "python"
    }
  ]
}
```

(`system_prompt` is an optional override of the server-side default.)
