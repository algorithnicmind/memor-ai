# High-Level Design (HLD) & Architectures

## 1. System Request Flow

### Phase 1: Ingestion (Multi-modal & Voice)
1. User input arrives via Text, Uploaded File/Image, or Voice.
2. **JWT decode**: A `current_user` dependency on every protected route validates the `Authorization: Bearer <jwt>` header and fetches the `User`. `user_id` is **always** taken from the JWT subject claim — never from the request body.
3. **Extraction**: The text is parsed by the chat LLM (default Mistral `mistral-large-latest` via the OpenAI-compatible SDK) to extract structured memory: typed facts (simple / decision / preference / plan), entities, and relations.

### Phase 2: Processing & Conflict Resolution
1. **Embedding**: The user's text is embedded by the same OpenAI-compatible client (`mistral-embed`, 1024-dim) and cached in-process.
2. **Collision search**: A cosine similarity search runs over the user's existing `MemoryVector` rows (threshold configurable; default ~0.5) to find facts that might overlap with the new one.
3. **Action resolution**: A second LLM call classifies each collision as `ADD` (new fact), `UPDATE` (supersedes / refines), `DELETE` (contradicted), or `NONE`.
4. **Persistence**: ADD rows are written to the vector store; UPDATE/DELETE rows are also written to the `MemoryHistory` table for audit. Entities + relations extracted from the text are upserted into the **Ladybug** graph.

### Phase 3: Dual-Memory Retrieval
1. **Parallel Search**:
   - **Vector Search (Tortoise / SQLite)**: Embeds the query and runs cosine similarity over the `MemoryVector` JSON column (relevance threshold filters noise).
   - **Graph Search (Ladybug)**: Entity extraction on the query (LLM tool call) → Cypher traversal over connected nodes.
2. **Re-Ranking**: `rank-bm25` scores the graph results and merges them with the vector hits before the context builder assembles the prompt.

### Phase 4: Generation & Live Voice
1. Combined context is sent to the **chat LLM** (Mistral default; configurable).
2. **Live Voice Mode**: If active, the LLM's text response is streamed to a Text-to-Speech (TTS) engine and played to the user.

---

## 2. Deployment Architecture & Microservice Design

The backend is designed using **SOLID principles** and a **Microservices-inspired architecture**. Even if deployed as a single FastAPI server initially, the domains are strictly decoupled into independent services.

```mermaid
flowchart TD
    subgraph Client
        UI[Next.js 16 + React 19]
    end
    
    subgraph API Gateway / Router
        Gateway[FastAPI Router]
    end
    
    subgraph Microservice Domains (Decoupled)
        AuthService[Auth Service]
        ChatService[Chat Inference Service]
        MemoryService[Memory Engine Service]
    end
    
    subgraph External APIs (OpenAI-SDK-compatible)
        Provider[Provider: Mistral default]
    end

    subgraph Data Layer (Repositories)
        UserDB[(SQLite - Users)]
        VectorDB[(SQLite - Vectors + History)]
        GraphDB[(Ladybug Graph)]
    end

    UI -->|HTTP + Bearer JWT| Gateway
    Gateway --> AuthService
    Gateway --> ChatService

    ChatService --> MemoryService
    MemoryService --> Provider
    MemoryService --> VectorDB
    MemoryService --> GraphDB

    ChatService --> Provider
```

### Architectural Principles Applied:
1. **Single Responsibility (SRP)**: The `Memory` orchestrator *only* handles vector / graph / history IO. The chat domain *only* handles the OpenAI-compatible chat client. The auth domain *only* handles register / login / token decode.
2. **Dependency Inversion (DIP)**: Domains depend on infrastructure through concrete repository classes (e.g., `vector_repo.py`, `graph_repo.py`, `tortoise_config.py`) injected by the FastAPI lifespan. The contract surface is small and replaceable.
3. **Clean Code**: High testability, decoupled domains, and strict `msgspec` validation boundaries between services. (`pydantic` only appears as `fastapi`'s own transitive dep — every DTO in our code is `msgspec.Struct`.)
4. **Tenant isolation**: `user_id` is sourced from the JWT subject claim on every protected call; no request body can override it.
