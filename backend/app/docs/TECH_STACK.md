# Memorai - Technology Stack & Architecture Guide

> **Comprehensive documentation on the technologies, packages, and architecture decisions**

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Frontend Technologies](#-frontend-technologies)
3. [Backend Technologies](#-backend-technologies)
4. [AI & ML Services](#-ai--ml-services)
5. [Database & Storage](#-database--storage)
6. [Architecture Decisions & Rationale](#-architecture-decisions--rationale)
7. [Package Dependencies](#-package-dependencies)
8. [Areas for Improvement](#-areas-for-improvement)
9. [Future Roadmap](#-future-roadmap)

---

## 🎯 Overview

Memorai is a full-stack AI chat application with **persistent memory** and **knowledge graph** capabilities. The project uses a modern, performant tech stack divided into two main components:

| Component | Stack | Purpose |
|-----------|-------|---------|
| **Frontend** | Next.js 16 + React 19 + TypeScript | Modern web interface with SSR |
| **Backend** | FastAPI + Python 3.12+ | Async REST API with memory engine |

---

## 🖥️ Frontend Technologies

### Core Framework

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **Next.js** | 16.1.1 | React meta-framework | App Router, SSR, file-based routing, optimized bundling. Next.js 16 provides the latest React Server Components support and improved performance. |
| **React** | 19.2.3 | UI library | React 19 introduces concurrent features, improved suspense, and better performance. We leverage the latest React features for optimal UX. |
| **TypeScript** | ^5 | Type-safe JavaScript | Catches errors at compile time, improves IDE support, and makes refactoring safer across the codebase. |

### Styling & Animation

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **Tailwind CSS** | ^4 | Utility-first CSS | Rapid prototyping, consistent design system, excellent DX with JIT compilation. v4 brings native CSS improvements. |
| **Motion (Framer Motion)** | 12.23.26 | Animations | Declarative API for complex animations, spring physics, gesture support. Creates premium, fluid UI interactions. |
| **@tailwindcss/typography** | ^0.5.19 | Prose styling | Beautiful default styles for markdown-rendered chat messages. |

### UI Components

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **Radix UI** | Various | Accessible primitives | Unstyled, accessible components (Avatar, Label, ScrollArea, Separator, Slot). Building blocks that follow WAI-ARIA guidelines. |
| **Lucide React** | ^0.562.0 | Icon library | Tree-shakeable, consistent icons with excellent React integration. |
| **class-variance-authority** | ^0.7.1 | Component variants | Type-safe component variants for building design systems (used with shadcn/ui pattern). |
| **clsx** | ^2.1.1 | Class names | Conditional class name joining, cleaner JSX. |
| **tailwind-merge** | ^3.4.0 | Class merging | Smart merging of Tailwind classes, avoids conflicts. |

### Content Rendering

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **react-markdown** | ^10.1.0 | Markdown rendering | Renders AI responses with proper formatting, code blocks, lists, etc. |
| **remark-gfm** | ^4.0.1 | GitHub Flavored Markdown | Tables, strikethrough, autolinks, task lists in chat messages. |

### Theming & UX

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **next-themes** | ^0.4.6 | Theme management | Dark/light mode with system preference detection, no flash on load. |
| **@floating-ui/react** | ^0.27.16 | Positioning | Tooltips, popovers, dropdowns with smart positioning. |

---

## ⚙️ Backend Technologies

### Web Framework

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **FastAPI** | ≥0.115.0 | Async REST API | Fastest Python framework, automatic OpenAPI docs, Pydantic integration, native async support. Perfect for I/O-bound LLM operations. |
| **Uvicorn** | ≥0.34.0 | ASGI server | Lightning-fast ASGI server, hot reload for development, production-ready. |
| **Pydantic** | ≥2.10.0 | Data validation | Type hints become runtime validators. Request/response models with automatic validation and serialization. |

### Serialization & Configuration

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **msgspec** | ≥0.20.0 | Fast serialization | Up to 10x faster than standard JSON. Used for internal data models and config. Memory-efficient struct-based objects. |
| **python-dotenv** | ≥1.2.1 | Environment variables | Loads `.env` files for configuration. Keeps secrets out of code. |

---

## 🤖 AI & ML Services

### Language Models

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **Mistral AI** | via OpenAI SDK | Chat LLM | High-quality, cost-effective responses. Uses OpenAI-compatible API (`mistral-small-latest`). Function calling for structured extraction. |
| **OpenAI SDK** | ≥2.14.0 | LLM client | Universal client that works with OpenAI-compatible APIs (Mistral, local models). Async support, tool calling. |

**Why Mistral over OpenAI?**
- **Cost**: Significantly cheaper per token
- **Performance**: Comparable quality for most use cases
- **API Compatibility**: Uses same OpenAI SDK interface
- **No Lock-in**: Easy to swap between providers

### Embeddings

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **Google Gemini** | google-genai ≥1.56.0 | Text embeddings | `text-embedding-004` model with 768-dimensional vectors. State-of-the-art semantic understanding, free tier available. |

**Why Gemini for Embeddings?**
- **Quality**: Excellent semantic similarity performance
- **Dimensions**: 768-dim provides good balance of quality vs storage
- **Cost**: Generous free tier
- **Speed**: Fast inference times

---

## 💾 Database & Storage

### Vector Storage

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **SQLite** | via aiosqlite ≥0.22.1 | Vector store | Embedded database, zero configuration, portable, reliable. Custom cosine similarity implementation for vector search. |

**Implementation Details:**
```
Vectors Table:
├── id (PRIMARY KEY)
├── collection (INDEX)
├── vector (JSON - list of floats)
├── payload (JSON - metadata)
├── created_at / updated_at
```

**Why SQLite over a dedicated vector DB?**
- **Simplicity**: No external service to manage
- **Portability**: Single file, easy backup/migration
- **Performance**: Fast for moderate dataset sizes (<100k vectors)
- **Trade-off**: Linear search; larger datasets need indexing

### Graph Storage

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **Kuzu** | ≥0.11.3 | Knowledge graph | Embedded graph database with Cypher-like queries. Stores entity relationships (e.g., "John → works_at → Google"). |

**Why Kuzu?**
- **Embedded**: No external service, runs in-process
- **Modern**: Built for analytics, fast graph traversal
- **Native Embeddings**: Supports vector storage in nodes
- **Cypher Syntax**: Familiar query language

**Graph Schema:**
```
Entity Node:
├── id, user_id, agent_id, run_id
├── name
├── mentions (count)
├── embedding (FLOAT[])
└── created

CONNECTED_TO Relationship:
├── name (relationship type)
├── mentions
├── created / updated
```

### Text Ranking

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **rank-bm25** | ≥0.2.2 | BM25 ranking | Re-ranks graph search results for relevance. Classic IR algorithm, no training required. |

---

## 🏗️ Architecture Decisions & Rationale

### 1. Dual Memory Architecture

```
User Query
    ↓
┌─────────────────────────────────────┐
│         Memory Search               │
│  ┌─────────────┐  ┌──────────────┐  │
│  │  Vector DB  │  │ Knowledge    │  │
│  │  (SQLite)   │  │   Graph      │  │
│  │             │  │  (Kuzu)      │  │
│  └─────────────┘  └──────────────┘  │
│        ↓                ↓           │
│   Semantic         Relationship     │
│   Similarity       Connections      │
└─────────────────────────────────────┘
    ↓
Combined Context → LLM → Response
```

**Rationale:**
- **Vectors**: Fast similarity search for "what" memories are relevant
- **Graph**: Understanding "how" entities are connected
- **Combined**: Richer context than either alone

### 2. Embedded Databases (SQLite + Kuzu)

**Decision**: Use embedded databases instead of external services.

**Pros:**
- Zero operational overhead
- No network latency
- Single deployment artifact
- Easy local development

**Cons:**
- Limited scalability (single machine)
- No built-in replication

### 3. LLM-Powered Fact Extraction

**Decision**: Use LLM to extract structured facts from user messages.

```python
# Input: "I decided to use Python because it has better ML libraries"
# Output:
{
    "memory": "Chose Python for programming",
    "memory_type": "decision",
    "decision_context": {
        "goal": "Choose programming language",
        "alternatives": ["Python", "other"],
        "final_choice": "Python",
        "reasoning": "Better ML libraries"
    }
}
```

**Rationale:**
- Structured data is more queryable
- Decision context preserves reasoning
- Types enable filtered retrieval

### 4. Hash-Based Deduplication

**Decision**: MD5 hash of content to prevent duplicate memories.

```python
content_hash = hashlib.md5(memory_content.encode()).hexdigest()
if await find_by_hash(content_hash):
    return existing_id  # Skip duplicate
```

**Rationale:**
- Simple, fast, and deterministic
- Prevents memory bloat
- Returns existing ID for reference

### 5. OpenAI-Compatible LLM Interface

**Decision**: Use OpenAI SDK with configurable base URL.

```python
self.client = AsyncOpenAI(
    api_key=config.api_key,
    base_url="https://api.mistral.ai/v1"  # Swap provider by changing URL
)
```

**Rationale:**
- Provider flexibility (Mistral, OpenAI, local models)
- Consistent API across implementations
- Easy migration path

---

## 📦 Package Dependencies

### Frontend (`package.json`)

```json
{
  "dependencies": {
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "@floating-ui/react": "^0.27.16",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@tailwindcss/typography": "^0.5.19",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.562.0",
    "motion": "^12.23.26",
    "next-themes": "^0.4.6",
    "radix-ui": "^1.4.3",
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "eslint": "^9",
    "eslint-config-next": "16.1.1",
    "tw-animate-css": "^1.4.0"
  }
}
```

### Backend (`pyproject.toml`)

```toml
[project]
requires-python = ">=3.12"
dependencies = [
    "aiosqlite>=0.22.1",      # Async SQLite
    "fastapi>=0.115.0",        # Web framework
    "google-genai>=1.56.0",    # Gemini embeddings
    "kuzu>=0.11.3",            # Graph database
    "msgspec>=0.20.0",         # Fast serialization
    "openai>=2.14.0",          # LLM client (Mistral)
    "pydantic>=2.10.0",        # Validation
    "python-dotenv>=1.2.1",    # Env vars
    "rank-bm25>=0.2.2",        # Text ranking
    "uvicorn>=0.34.0",         # ASGI server
]
```

---

## 🔧 Areas for Improvement

### High Priority

| Area | Current State | Improvement | Benefit |
|------|---------------|-------------|---------|
| **Vector Search Performance** | Linear scan (O(n)) | Implement HNSW or IVF indexing | 10-100x faster for large datasets |
| **Authentication** | Simple password | OAuth2 / OpenID Connect | Secure, standardized auth |
| **Rate Limiting** | None | Add rate limiting middleware | Prevent abuse, protect LLM costs |
| **Caching** | None | Redis/memcached for embeddings | Reduce duplicate API calls |

### Medium Priority

| Area | Current State | Improvement | Benefit |
|------|---------------|-------------|---------|
| **Streaming Responses** | Full response wait | SSE/WebSocket streaming | Better UX for long responses |
| **Multi-user Isolation** | Basic user_id filter | Tenant isolation, encryption | Enterprise readiness |
| **Error Handling** | Generic exceptions | Structured error codes | Better debugging, client handling |
| **Testing** | Minimal | Unit + integration tests | Reliability, CI/CD |

### Low Priority (Nice to Have)

| Area | Current State | Improvement | Benefit |
|------|---------------|-------------|---------|
| **Conversation History** | In memory only | Persistent chat sessions | Resume conversations |
| **Memory Visualization** | Text list | Graph visualization | Better UX for exploring memories |
| **Export/Import** | None | JSON export/import | Data portability |
| **Multi-modal** | Text only | Image/voice support | Richer interactions |

---

## 🔮 Future Roadmap

### Phase 1: Production Readiness
- [ ] Add comprehensive logging with structured output
- [ ] Implement proper error handling with custom exceptions
- [ ] Add health checks with dependency status
- [ ] Set up Prometheus metrics
- [ ] Docker containerization

### Phase 2: Scalability
- [ ] Replace SQLite vector store with pgvector or Qdrant
- [ ] Add Redis caching layer
- [ ] Implement connection pooling
- [ ] Horizontal scaling with load balancer

### Phase 3: Features
- [ ] Real-time streaming responses
- [ ] Conversation branching
- [ ] Memory importance scoring
- [ ] Cross-user shared knowledge (with privacy controls)

### Phase 4: AI Improvements
- [ ] Fine-tuned embedding model for domain
- [ ] Memory consolidation (merge similar memories)
- [ ] Proactive memory recall (AI suggests relevant past context)
- [ ] Multi-LLM routing (different models for different tasks)

---

## 📚 References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Kuzu Database](https://kuzudb.com/)
- [Mistral AI](https://mistral.ai/)
- [Google Gemini](https://ai.google.dev/)
- [Radix UI](https://www.radix-ui.com/)
- [Framer Motion (Motion)](https://motion.dev/)

---

*Document Version: 1.0*  
*Last Updated: January 11, 2026*
