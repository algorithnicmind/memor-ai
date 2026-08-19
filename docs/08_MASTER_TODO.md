# MASTER TODO

## Phase 1: Foundation & Setup
- [ ] Initialize Next.js project with Tailwind CSS.
- [ ] Initialize FastAPI project with Pydantic.
- [ ] Setup SQLite database and basic ORM models (Users, Conversations, Messages).
- [ ] Implement JWT Authentication flow.
- [ ] Create basic Chat UI (Frontend) and `/chat` endpoint (Backend) - No memory yet.

## Phase 2: Core Memory Engine
- [ ] Setup local LLM pipeline (Ollama/Llama.cpp) and cloud fallback (Mistral/Gemini).
- [ ] Develop `Memory Extractor` logic (Prompt design to extract JSON from messages).
- [ ] Implement `Memory Classifier` (Assigning types: goal, plan, decision, etc.).
- [ ] Implement `Importance Scorer` algorithm.
- [ ] Build `Duplicate Detection` module.
- [ ] Build `Conflict Resolution` module (mark old facts as superseded).

## Phase 3: Vector & Graph Integration
- [ ] Setup local Embeddings model (e.g., HuggingFace sentence-transformers).
- [ ] Integrate Vector DB (ChromaDB / Qdrant) and store embedded memories.
- [ ] Setup Kuzu Graph DB.
- [ ] Update Extractor to parse Entities and Relationships, storing them in Kuzu.
- [ ] Implement `Dual Retrieval System`: Query both Vector DB and Graph DB.

## Phase 4: Context Building & UI Polish
- [ ] Implement `Memory Ranker` (Semantic Similarity + Importance + Recency + Rel_Strength).
- [ ] Implement `Context Builder` to format memories into the system prompt.
- [ ] Connect full pipeline: Message -> Extract -> Retrieve -> Context -> LLM -> Response.
- [ ] Build Memory Panel in the Chat UI.
- [ ] Build dedicated Memory Dashboard page (view, edit, delete memories).
- [ ] Implement "Why did you say that?" transparency feature.

## Phase 5: Testing & Optimization
- [ ] Write Test Case 1: Basic memory recall.
- [ ] Write Test Case 2: Cross-session memory recall.
- [ ] Write Test Case 3: Contradiction/Conflict resolution.
- [ ] Write Test Case 4: Irrelevant memory filtering.
- [ ] Write Test Case 5: Graph reasoning (multi-hop).
- [ ] Measure latency and token efficiency. Optimize prompts.
- [ ] Final documentation and deployment scripts (Docker compose).
