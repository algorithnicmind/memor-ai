# High-Level Design (HLD) & Architectures

## 1. System Request Flow

### Phase 1: Ingestion (Multi-modal & Voice)
1. User input arrives via Text, Uploaded File/Image, or Voice.
2. **Extraction**: The text is parsed by the LLM (Mistral API) to extract structured memory (facts, decisions, entities).

### Phase 2: Processing & Deduplication
1. **Hash-Based Deduplication**: Content is hashed (MD5). If an exact hash match exists, skip to Phase 3.
2. **Persistence**: Saves embedding to the **SQLite Vectors table** and edges to the **Kuzu Graph**.

### Phase 3: Dual-Memory Retrieval
1. **Parallel Search**:
   - **Vector Search (SQLite)**: Embeds the query and performs custom cosine similarity against the SQLite vector table (threshold=0.5).
   - **Graph Search (Kuzu)**: Extracts entities from the query, traverses the Kuzu graph for connected nodes.
2. **Re-Ranking**: Uses `rank-bm25` to evaluate graph search results and merge them optimally.

### Phase 4: Generation & Live Voice
1. Combined context is sent to the **Mistral API**.
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
    
    subgraph External Cloud APIs
        Mistral[Mistral API]
        Gemini[Gemini API]
    end
    
    subgraph Data Layer (Repositories)
        UserDB[(SQLite - Users)]
        VectorDB[(SQLite - Vectors)]
        GraphDB[(Kuzu Graph)]
    end

    UI -->|HTTP| Gateway
    Gateway --> AuthService
    Gateway --> ChatService
    
    ChatService --> MemoryService
    MemoryService --> Gemini
    MemoryService --> VectorDB
    MemoryService --> GraphDB
    
    ChatService --> Mistral
```

### Architectural Principles Applied:
1. **Single Responsibility (SRP)**: The `MemoryService` *only* handles SQLite/Kuzu operations. The `ChatService` *only* handles Mistral LLM requests.
2. **Dependency Inversion (DIP)**: Services rely on abstract Interfaces/Repositories (e.g., `VectorStoreInterface`) rather than concrete database classes.
3. **Clean Code**: High testability, decoupled domains, and strict Pydantic validation boundaries between services.
