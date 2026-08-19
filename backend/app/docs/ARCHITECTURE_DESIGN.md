# 🏗️ Memorai - Architecture Design Document

> **Complete System Architecture & Design Decisions**
>
> _Last Updated: February 2, 2026_

---

## 📋 Table of Contents

1. [System Overview](#-system-overview)
2. [Architecture Diagrams](#-architecture-diagrams)
3. [Component Details](#-component-details)
4. [Data Flow](#-data-flow)
5. [Database Schema](#-database-schema)
6. [Design Decisions & Rationale](#-design-decisions--rationale)
7. [Security Architecture](#-security-architecture)
8. [Scalability Considerations](#-scalability-considerations)

---

## 🎯 System Overview

### What is Memorai?

Memorai is an AI chatbot with **persistent memory**. It uses a **dual-memory architecture** that combines:

1. **Vector Memory** - For semantic similarity search ("What is similar?")
2. **Knowledge Graph** - For relationship understanding ("How are things connected?")

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MEMORAI SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐              ┌──────────────────────────────────┐ │
│  │                      │   REST API   │                                  │ │
│  │      FRONTEND        │◄────────────►│           BACKEND                │ │
│  │     (Next.js)        │   HTTP/JSON  │          (FastAPI)               │ │
│  │                      │              │                                  │ │
│  └──────────────────────┘              └──────────────────────────────────┘ │
│           │                                          │                       │
│           │                           ┌──────────────┼──────────────┐       │
│           │                           │              │              │       │
│           ▼                           ▼              ▼              ▼       │
│  ┌────────────────┐          ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │   Browser      │          │  Mistral   │ │   Gemini   │ │    Kuzu    │  │
│  │   (User UI)    │          │    LLM     │ │ Embeddings │ │   Graph    │  │
│  └────────────────┘          └────────────┘ └────────────┘ └────────────┘  │
│                                     │              │              │         │
│                                     └──────────────┼──────────────┘         │
│                                                    │                        │
│                                                    ▼                        │
│                                           ┌────────────────┐                │
│                                           │    SQLite      │                │
│                                           │   (Storage)    │                │
│                                           └────────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Architecture Diagrams

### 1. Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16 + React 19)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           APP ROUTER                                 │    │
│  │  ┌─────────────────┐    ┌────────────────────────────────────────┐  │    │
│  │  │   /             │    │   /(chat)/chat                         │  │    │
│  │  │   Login Page    │    │   Chat Interface                       │  │    │
│  │  │                 │    │                                        │  │    │
│  │  │  ┌───────────┐  │    │  ┌──────────────┐  ┌───────────────┐  │  │    │
│  │  │  │ Password  │  │    │  │ Message List │  │ Memory Sidebar│  │  │    │
│  │  │  │ Input     │  │    │  │              │  │               │  │  │    │
│  │  │  └───────────┘  │    │  │ ┌──────────┐ │  │ ┌───────────┐ │  │  │    │
│  │  │  ┌───────────┐  │    │  │ │ Message  │ │  │ │ Memory 1  │ │  │  │    │
│  │  │  │ Login Btn │  │    │  │ │ Bubble   │ │  │ │ Memory 2  │ │  │  │    │
│  │  │  └───────────┘  │    │  │ └──────────┘ │  │ │ Memory 3  │ │  │  │    │
│  │  └─────────────────┘    │  └──────────────┘  │ └───────────┘ │  │  │    │
│  │                         │                     └───────────────┘  │  │    │
│  │                         │  ┌──────────────────────────────────┐  │  │    │
│  │                         │  │ Chat Input + Send Button         │  │  │    │
│  │                         │  └──────────────────────────────────┘  │  │    │
│  │                         └────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         SHARED COMPONENTS                            │    │
│  │                                                                      │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │  Button  │ │  Input   │ │   Card   │ │  Avatar  │ │  Badge   │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         UTILITIES (lib/)                             │    │
│  │                                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │   api.ts     │  │   auth.ts    │  │   types.ts   │               │    │
│  │  │ (API calls)  │  │ (Auth logic) │  │ (TS types)   │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Backend Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI + Python 3.12)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         API LAYER (server.py)                        │    │
│  │                                                                      │    │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────┐ │    │
│  │  │ POST /chat    │ │ GET /memories │ │DELETE /memories│ │GET /health│ │    │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └──────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    MEMORY ENGINE (memory/core.py)                    │    │
│  │                         🧠 THE BRAIN 🧠                              │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                    CORE FUNCTIONS                            │    │    │
│  │  │                                                              │    │    │
│  │  │  • add_memory()      - Store new memories                    │    │    │
│  │  │  • search_memories() - Find relevant memories                │    │    │
│  │  │  • update_memory()   - Update conflicting info               │    │    │
│  │  │  • delete_memory()   - Remove memories                       │    │    │
│  │  │  • extract_facts()   - LLM extracts facts from messages      │    │    │
│  │  │                                                              │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│           ┌──────────────────────────┼──────────────────────────┐           │
│           │                          │                          │           │
│           ▼                          ▼                          ▼           │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐     │
│  │  LLM SERVICE    │      │  EMBEDDING SVC  │      │   GRAPH SVC     │     │
│  │  (llm/mistral)  │      │  (embed/gemini) │      │  (graph/kuzu)   │     │
│  │                 │      │                 │      │                 │     │
│  │  • Chat         │      │  • Text→Vector  │      │  • Add entity   │     │
│  │  • Extract      │      │  • 768 dims     │      │  • Add relation │     │
│  │    facts        │      │  • Google API   │      │  • Search graph │     │
│  └─────────────────┘      └─────────────────┘      └─────────────────┘     │
│           │                          │                          │           │
│           └──────────────────────────┼──────────────────────────┘           │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      STORAGE LAYER                                   │    │
│  │                                                                      │    │
│  │  ┌────────────────────────┐      ┌────────────────────────────┐     │    │
│  │  │    VECTOR STORE        │      │      GRAPH STORE           │     │    │
│  │  │   (storage/vector.py)  │      │      (Kuzu DB)             │     │    │
│  │  │                        │      │                            │     │    │
│  │  │   SQLite Database      │      │   Entity Nodes             │     │    │
│  │  │   • vectors table      │      │   Relationship Edges       │     │    │
│  │  │   • embeddings         │      │   Cypher-like queries      │     │    │
│  │  │   • metadata           │      │                            │     │    │
│  │  └────────────────────────┘      └────────────────────────────┘     │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Dual-Memory Architecture (Core Innovation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DUAL-MEMORY ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  When user says: "I love Python and I work at Google as a developer"        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │                    MEMORY 1: VECTOR STORE                           │    │
│  │                    ───────────────────────                          │    │
│  │                    "What is similar?"                               │    │
│  │                                                                      │    │
│  │   Input: "I love Python"                                            │    │
│  │          ↓                                                          │    │
│  │   Embedding: [0.12, -0.34, 0.56, 0.78, -0.23, ...]  (768 numbers)  │    │
│  │          ↓                                                          │    │
│  │   Store in SQLite with metadata                                     │    │
│  │          ↓                                                          │    │
│  │   Later search: "What programming language?" → Finds "Python"!     │    │
│  │                                                                      │    │
│  │   ┌────────────────────────────────────────────────────────────┐    │    │
│  │   │  ID  │  Content            │  Vector         │  Score     │    │    │
│  │   │──────│─────────────────────│─────────────────│────────────│    │    │
│  │   │  1   │  "User loves Python"│  [0.12, -0.34..]│  0.92      │    │    │
│  │   │  2   │  "User works at..."│  [0.45, 0.23...] │  0.78      │    │    │
│  │   └────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │                    MEMORY 2: KNOWLEDGE GRAPH                        │    │
│  │                    ─────────────────────────                        │    │
│  │                    "How are things connected?"                      │    │
│  │                                                                      │    │
│  │                                                                      │    │
│  │                        ┌────────┐                                   │    │
│  │                        │  User  │                                   │    │
│  │                        └────────┘                                   │    │
│  │                       /    │    \                                   │    │
│  │              loves   /     │     \  works_at                       │    │
│  │                     /      │      \                                 │    │
│  │                    ▼       │       ▼                                │    │
│  │             ┌────────┐     │    ┌────────┐                         │    │
│  │             │ Python │     │    │ Google │                         │    │
│  │             └────────┘     │    └────────┘                         │    │
│  │                  │         │         │                              │    │
│  │            is_a  │    is_a │    is_a │                              │    │
│  │                  ▼         ▼         ▼                              │    │
│  │             ┌────────┐ ┌────────┐ ┌────────────┐                   │    │
│  │             │Language│ │Developer│ │Tech Company│                   │    │
│  │             └────────┘ └────────┘ └────────────┘                   │    │
│  │                                                                      │    │
│  │   Query: "Tell me about my job"                                     │    │
│  │   Graph traversal: User → works_at → Google → is_a → Tech Company  │    │
│  │   Response: "You work at Google, a tech company!"                   │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │                    COMBINED RESULT                                  │    │
│  │                    ───────────────                                  │    │
│  │                                                                      │    │
│  │   Vector memories (what) + Graph relations (how) = Rich Context    │    │
│  │                                                                      │    │
│  │   Context sent to LLM:                                              │    │
│  │   "User loves Python, works at Google (tech company) as developer" │    │
│  │                                                                      │    │
│  │   AI can now give personalized, contextual responses!               │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Complete Message Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     COMPLETE MESSAGE FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: User sends message                                                 │
│  ─────────────────────────────                                              │
│                                                                              │
│  User: "What programming language should I learn for AI?"                   │
│       ↓                                                                     │
│  Frontend captures message and sends to backend                             │
│       ↓                                                                     │
│  POST /chat { message: "...", user_id: "user_123" }                        │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 2: Search for relevant memories                                       │
│  ────────────────────────────────────                                       │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  PARALLEL SEARCH                                                    │    │
│  │                                                                     │    │
│  │  Vector Search:                    Graph Search:                    │    │
│  │  ───────────────                   ─────────────                    │    │
│  │  1. Embed query                    1. Extract entities              │    │
│  │  2. Search SQLite                  2. Query Kuzu graph              │    │
│  │  3. Return top-k                   3. Traverse relationships        │    │
│  │     similar memories               4. Return connected nodes        │    │
│  │                                                                     │    │
│  │  Results:                          Results:                         │    │
│  │  • "User likes Python" (0.89)      • User → interested_in → AI     │    │
│  │  • "User learning ML" (0.82)       • Python → good_for → ML        │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 3: Build context and generate response                               │
│  ───────────────────────────────────────────                               │
│                                                                              │
│  Context prompt:                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  System: You are a helpful AI. Here's what you know about user:    │    │
│  │                                                                     │    │
│  │  Memories:                                                          │    │
│  │  - User likes Python (confidence: 0.89)                            │    │
│  │  - User is learning machine learning (confidence: 0.82)            │    │
│  │                                                                     │    │
│  │  Relationships:                                                     │    │
│  │  - User is interested in AI                                        │    │
│  │  - Python is good for ML                                           │    │
│  │                                                                     │    │
│  │  User's question: What programming language should I learn for AI? │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│       ↓                                                                     │
│  Send to Mistral LLM                                                        │
│       ↓                                                                     │
│  Response: "Based on your interest in AI and ML, I'd recommend Python!     │
│             It has the best libraries like TensorFlow and PyTorch..."      │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 4: Extract and save NEW memories                                     │
│  ─────────────────────────────────────                                     │
│                                                                              │
│  From conversation, LLM extracts:                                           │
│  • "User is asking about AI programming languages"                          │
│  • "User is considering learning a new language"                            │
│       ↓                                                                     │
│  Check for duplicates (hash-based)                                          │
│       ↓                                                                     │
│  Store new memories + Add to graph                                          │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 5: Return response to frontend                                       │
│  ────────────────────────────────────                                       │
│                                                                              │
│  {                                                                          │
│    "response": "Based on your interest in AI...",                          │
│    "memories_used": [                                                       │
│      { "memory": "User likes Python", "score": 0.89 }                      │
│    ],                                                                       │
│    "relations_used": [                                                      │
│      { "source": "User", "relation": "interested_in", "target": "AI" }     │
│    ]                                                                        │
│  }                                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema

### SQLite Vector Store Schema

```sql
-- Main vectors table for storing embeddings
CREATE TABLE vectors (
    id TEXT PRIMARY KEY,              -- Unique memory ID (UUID)
    collection TEXT NOT NULL,         -- Collection name (default: "memories")
    content TEXT NOT NULL,            -- The actual memory text
    content_hash TEXT UNIQUE,         -- MD5 hash for deduplication
    vector TEXT NOT NULL,             -- JSON array of 768 floats
    payload TEXT,                     -- JSON metadata
    user_id TEXT NOT NULL,            -- User isolation
    agent_id TEXT,                    -- Optional agent ID
    run_id TEXT,                      -- Optional run ID
    memory_type TEXT DEFAULT 'simple',-- simple/decision/preference/plan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX idx_vectors_user_id ON vectors(user_id);
CREATE INDEX idx_vectors_collection ON vectors(collection);
CREATE INDEX idx_vectors_content_hash ON vectors(content_hash);
CREATE INDEX idx_vectors_memory_type ON vectors(memory_type);
```

### Kuzu Knowledge Graph Schema

```cypher
// Entity Node - Represents any named entity
CREATE NODE TABLE Entity (
    id STRING,
    user_id STRING,
    agent_id STRING,
    run_id STRING,
    name STRING,          // Entity name (e.g., "Python", "Google")
    entity_type STRING,   // person, company, technology, concept
    mentions INT64,       // How many times mentioned
    embedding FLOAT[768], // Optional embedding for similarity
    created TIMESTAMP,
    PRIMARY KEY (id)
)

// Relationship between entities
CREATE REL TABLE CONNECTED_TO (
    FROM Entity TO Entity,
    name STRING,          // Relationship type (loves, works_at, etc.)
    weight FLOAT,         // Relationship strength
    mentions INT64,       // How many times mentioned
    created TIMESTAMP,
    updated TIMESTAMP
)
```

### Memory Types Schema

```json
// Simple memory
{
  "id": "mem_abc123",
  "memory": "User's name is John",
  "memory_type": "simple",
  "user_id": "user_123"
}

// Decision memory (with full context)
{
  "id": "mem_def456",
  "memory": "Chose Python over Java",
  "memory_type": "decision",
  "decision_context": {
    "goal": "Choose a programming language",
    "constraints": ["limited time", "need for AI/ML"],
    "alternatives": ["Python", "Java", "Go"],
    "final_choice": "Python",
    "reasoning": "Better ML libraries",
    "emotional_state": "confident",
    "confidence": 0.9
  }
}

// Preference memory
{
  "id": "mem_ghi789",
  "memory": "Prefers dark mode",
  "memory_type": "preference",
  "strength": "strong"
}

// Plan memory
{
  "id": "mem_jkl012",
  "memory": "Planning to learn Rust next month",
  "memory_type": "plan",
  "timeline": "next month",
  "status": "planned"
}
```

---

## 🎯 Design Decisions & Rationale

### Decision 1: Dual Memory Architecture

| Aspect        | Choice          | Rationale                                   |
| ------------- | --------------- | ------------------------------------------- |
| **Vector DB** | SQLite (custom) | Simple, no external service, portable       |
| **Graph DB**  | Kuzu            | Embedded, modern, fast, Cypher syntax       |
| **Why both?** | Complementary   | Vectors = similarity, Graph = relationships |

### Decision 2: Embedded Databases

**Why embedded (SQLite + Kuzu) instead of external services (PostgreSQL + Neo4j)?**

| Pros                       | Cons                       |
| -------------------------- | -------------------------- |
| ✅ Zero setup - just works | ❌ Single machine only     |
| ✅ No network latency      | ❌ No built-in replication |
| ✅ Single deployment       | ❌ Limited scalability     |
| ✅ Easy local development  |                            |
| ✅ Data portability        |                            |

**Verdict:** Perfect for hackathon and small-medium scale. Can migrate later if needed.

### Decision 3: LLM Provider

| Choice  | Mistral AI           | OpenAI       |
| ------- | -------------------- | ------------ |
| Cost    | ✅ Cheaper           | ❌ Expensive |
| Quality | ✅ Very good         | ✅ Excellent |
| Speed   | ✅ Fast              | ✅ Fast      |
| API     | ✅ OpenAI-compatible | ✅ Native    |

**Decision:** Mistral via OpenAI SDK for cost savings + easy provider switching.

### Decision 4: Frontend Framework

| Choice      | Next.js 16    | Create React App | Vite       |
| ----------- | ------------- | ---------------- | ---------- |
| SSR         | ✅ Built-in   | ❌ No            | ❌ No      |
| Routing     | ✅ File-based | ❌ Manual        | ❌ Manual  |
| Performance | ✅ Optimized  | ⚠️ Basic         | ✅ Good    |
| Ecosystem   | ✅ Mature     | ⚠️ Deprecated    | ✅ Growing |

**Decision:** Next.js 16 for modern features and production-ready setup.

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Layer 1: Authentication                                                    │
│  ───────────────────────                                                    │
│  • Simple password-based auth (for hackathon)                               │
│  • Session cookie after login                                               │
│  • User ID tied to all requests                                             │
│                                                                              │
│  Layer 2: User Isolation                                                    │
│  ───────────────────────                                                    │
│  • Every memory has user_id                                                 │
│  • All queries filtered by user_id                                          │
│  • Users can only see their own memories                                    │
│                                                                              │
│  Layer 3: API Security                                                      │
│  ─────────────────────                                                      │
│  • CORS configured for frontend origin                                      │
│  • Request validation via Pydantic                                          │
│  • Rate limiting (future)                                                   │
│                                                                              │
│  Layer 4: Data Security                                                     │
│  ─────────────────────                                                      │
│  • Local storage (no cloud exposure)                                        │
│  • API keys in environment variables                                        │
│  • No sensitive data logged                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📈 Scalability Considerations

### Current Limitations (Hackathon Version)

| Component     | Current       | Limitation                    |
| ------------- | ------------- | ----------------------------- |
| Vector search | Linear scan   | O(n) - slow for >10k memories |
| Database      | SQLite        | Single file, single writer    |
| Graph         | Kuzu embedded | Single machine                |
| Users         | Simple auth   | No proper sessions            |

### Future Scaling Path

```
Phase 1 (Current)          Phase 2 (Scale)           Phase 3 (Production)
─────────────────          ───────────────           ────────────────────

SQLite vectors     ──►     pgvector           ──►    Qdrant/Pinecone
                           (PostgreSQL)              (Managed cloud)

Kuzu embedded      ──►     Neo4j              ──►    Neo4j Aura
                           (Self-hosted)             (Managed cloud)

Simple auth        ──►     JWT tokens         ──►    OAuth2/OIDC
                           (Stateless)               (Enterprise SSO)

Single server      ──►     Docker + LB        ──►    Kubernetes
                           (Basic scaling)           (Auto-scaling)
```

---

## 📊 Performance Targets

| Operation            | Target | Current    |
| -------------------- | ------ | ---------- |
| Chat response time   | <2s    | ~1-2s      |
| Memory search        | <200ms | ~100-200ms |
| Memory save          | <500ms | ~300ms     |
| Embedding generation | <100ms | ~50ms      |
| Page load            | <1s    | ~500ms     |

---

## 📄 File Structure Reference

```
Memorai/
├── frontend/                     # Next.js Frontend
│   ├── app/                      # Pages (App Router)
│   │   ├── page.tsx             # Login
│   │   ├── layout.tsx           # Root layout
│   │   └── (chat)/chat/         # Chat interface
│   ├── components/               # React components
│   │   ├── chat/                # Chat-specific
│   │   └── ui/                  # Shared UI
│   └── lib/                     # Utilities
│       ├── api.ts               # API client
│       └── types.ts             # TypeScript types
│
├── backend/                      # Python Backend
│   ├── server.py                # FastAPI endpoints
│   ├── config.py                # Configuration
│   ├── models.py                # Data models
│   ├── prompts.py               # LLM prompts
│   ├── memory/
│   │   └── core.py              # Memory engine (BRAIN)
│   ├── embeddings/
│   │   └── gemini.py            # Gemini embeddings
│   ├── llm/
│   │   └── mistral.py           # Mistral LLM
│   ├── graph/
│   │   └── kuzu.py              # Knowledge graph
│   └── storage/
│       ├── sqlite.py            # History storage
│       └── vector.py            # Vector storage
│
└── docs/                         # Documentation
    ├── ARCHITECTURE_DESIGN.md   # This file
    ├── PROJECT_ROADMAP.md       # Complete roadmap
    ├── TEAM_TASKS.md            # Task tracker
    ├── HACKATHON_PITCH.md       # Presentation
    ├── HOW_IT_WORKS.md          # Simple guide
    ├── TECHNICAL_DOCUMENTATION.md # Technical specs
    └── TECH_STACK.md            # Technology choices
```

---

<div align="center">

## 🏗️ Architecture Complete!

**Memorai** - _Dual-Memory AI Architecture_

_Built for Hackathon 2026_

</div>

---

_Document Version: 1.0_
_Created: February 2, 2026_
