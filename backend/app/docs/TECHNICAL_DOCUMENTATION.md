# Memorai - Technical Documentation

> **An AI Chat Application with Persistent Memory & Knowledge Graph**

---

## 📌 Executive Summary

**Memorai** is an advanced AI chat application that solves one of the biggest limitations of standard chatbots: **memory loss between conversations**. Unlike traditional chat applications where context is lost after each session, Memorai remembers everything you tell it, builds relationships between concepts, and provides increasingly personalized responses over time.

---

## 🎯 Problem Statement

### The Current State of AI Chatbots

Traditional AI chatbots, including popular ones like ChatGPT, suffer from:

1. **Session-Based Memory Loss** - Conversations start fresh every time
2. **No Personalization** - The AI doesn't remember your preferences, decisions, or past discussions
3. **Repetitive Interactions** - Users must re-explain their context repeatedly
4. **Isolated Conversations** - No connection between related topics discussed in different sessions

### Our Solution

Memorai implements a **dual-memory architecture** combining:
- **Vector-based semantic memory** for fast, similarity-based recall
- **Knowledge graph storage** for understanding relationships between entities

This allows the AI to not just remember facts, but understand how they connect to each other.

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Next.js 16 + React 19                  │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │   │
│  │  │   Login     │  │  Chat UI     │  │  Memory Panel  │   │   │
│  │  │   Page      │  │  Interface   │  │  (Sidebar)     │   │   │
│  │  └─────────────┘  └──────────────┘  └────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                      REST API Calls                             │
└──────────────────────────────│──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   FastAPI Server                         │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │   │
│  │  │   /chat     │  │  /memories   │  │  /health       │   │   │
│  │  │   Endpoint  │  │  Endpoint    │  │  Endpoint      │   │   │
│  │  └─────────────┘  └──────────────┘  └────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────▼──────────────────────────────┐   │
│  │                   Memory Engine (Core)                    │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  • Fact Extraction (LLM-powered)                   │  │   │
│  │  │  • Structured Memory Classification                │  │   │
│  │  │  • Duplicate Detection (Hash-based)                │  │   │
│  │  │  • Memory UPDATE/DELETE Intelligence               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │   Mistral   │     │   Gemini    │     │     Kuzu        │   │
│  │     LLM     │     │  Embeddings │     │  Knowledge      │   │
│  │  (Chat +    │     │  (768-dim   │     │    Graph        │   │
│  │   Prompts)  │     │   vectors)  │     │   (Entities +   │   │
│  │             │     │             │     │   Relations)    │   │
│  └─────────────┘     └─────────────┘     └─────────────────┘   │
│         │                    │                    │             │
│         ▼                    ▼                    │             │
│  ┌───────────────────────────────────────────────┐│             │
│  │             SQLite Storage Layer              ││             │
│  │  ┌──────────────┐  ┌────────────────────┐     │             │
│  │  │  History DB  │  │  Vector Store DB   │     │             │
│  │  │  (Sessions)  │  │  (Embeddings +     │     │             │
│  │  │              │  │   Metadata)        │     │             │
│  │  └──────────────┘  └────────────────────┘     │             │
│  └───────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Core Innovation: Dual-Memory Architecture

### 1. Vector-Based Semantic Memory

**Purpose:** Fast similarity-based retrieval of relevant memories

**How it Works:**
```
User Input → Gemini Embedding → 768-dim Vector → Cosine Similarity Search → Top-K Results
```

**Features:**
- Uses Google's `text-embedding-004` model for state-of-the-art embeddings
- Stores embeddings in SQLite with custom cosine similarity implementation
- Relevance threshold filtering (default 0.5) to eliminate noise
- Supports metadata-based filtering (user_id, agent_id, run_id)

### 2. Knowledge Graph Memory

**Purpose:** Understanding relationships between entities for contextual reasoning

**How it Works:**
```
User Input → Entity Extraction (LLM) → Relationship Mapping → Kuzu Graph Storage
```

**Features:**
- **Entity Extraction:** LLM identifies key entities (people, places, concepts, decisions)
- **Relationship Mapping:** Establishes connections like "John → works_at → Google"
- **BM25 Ranking:** Re-ranks graph search results for relevance
- **Graph Traversal:** Finds related concepts through connection paths

### 3. Memory Classification System

Memories are automatically classified into types:

| Type | Description | Example |
|------|-------------|---------|
| `simple` | Basic facts, personal details | "My name is John" |
| `decision` | Choices with full context | "I chose Python over Java because..." |
| `preference` | Likes, dislikes, preferences | "I prefer dark mode" |
| `plan` | Future intentions, goals | "I'm planning to learn Rust next month" |

### 4. Decision Memory with Context

For decisions, Memorai captures:

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

---

## 💻 Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.1 | React framework with App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | ^5 | Type-safe JavaScript |
| **Tailwind CSS** | ^4 | Utility-first CSS framework |
| **Motion (Framer Motion)** | 12.23.26 | Animations & transitions |
| **Radix UI** | Various | Accessible UI primitives |
| **Lucide React** | 0.562.0 | Icon library |
| **React Markdown** | 10.1.0 | Markdown rendering in chat |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | ≥3.12 | Core language |
| **FastAPI** | ≥0.115.0 | Async REST API framework |
| **Mistral AI** | via OpenAI SDK | Large Language Model |
| **Google Gemini** | google-genai ≥1.56.0 | Text embeddings |
| **Kuzu** | ≥0.11.3 | Embedded graph database |
| **SQLite** | via aiosqlite | Vector & history storage |
| **msgspec** | ≥0.20.0 | Fast serialization |
| **Pydantic** | ≥2.10.0 | Data validation |
| **rank-bm25** | ≥0.2.2 | BM25 text ranking |

---

## 🔧 Key Features Implementation

### 1. Intelligent Memory Addition

When a user sends a message, Memorai:

```python
# 1. Extracts facts using LLM
structured_facts = await llm.generate_response(
    messages=[{
        "role": "system", 
        "content": "Extract facts with types: simple, decision, preference, plan"
    }]
)

# 2. Generates embeddings for similarity checking
embedding = await gemini.embed(fact_content)

# 3. Searches for existing similar memories
existing = await vector_store.search(embedding, threshold=0.5)

# 4. Determines action: ADD, UPDATE, or DELETE
if is_contradictory(existing, new_fact):
    await memory.update(existing_id, new_fact)  # UPDATE
elif is_obsolete(existing, new_fact):
    await memory.delete(existing_id)  # DELETE
else:
    await memory.create(new_fact)  # ADD

# 5. Adds to knowledge graph
await graph.add(new_fact, extract_entities=True)
```

### 2. Context-Aware Response Generation

```python
# 1. Search for relevant memories
memories = await memory.search(user_message, limit=5, threshold=0.5)

# 2. Get related knowledge from graph
relations = await graph.search(user_message)

# 3. Build context-enriched prompt
context = f"""
Relevant memories:
{format_memories(memories)}

Related knowledge:
{format_relations(relations)}
"""

# 4. Generate response with context
response = await llm.chat(user_message, system_prompt=context)
```

### 3. Deduplication & Conflict Resolution

```python
# Hash-based deduplication
content_hash = hashlib.md5(memory_content.encode()).hexdigest()
existing = await find_by_hash(content_hash)

if existing:
    return existing.id  # Already exists, skip

# LLM-powered conflict detection
if contradicts_existing(new_fact, existing_memories):
    # Update the old memory with new information
    await update_with_changelog(old_memory_id, new_fact)
```

---

## 📂 Project Structure

```
Memorai/
├── frontend/                      # Next.js Frontend
│   ├── app/                       # App Router pages
│   │   ├── page.tsx              # Login page
│   │   ├── (chat)/chat/          # Chat interface
│   │   └── api/auth/             # Auth API routes
│   ├── components/
│   │   ├── chat/                 # Chat components
│   │   │   ├── chat-interface.tsx
│   │   │   └── ...
│   │   ├── ui/                   # Shadcn UI components
│   │   └── animate-ui/           # Animated components
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   ├── auth.ts              # Auth utilities
│   │   └── types.ts             # TypeScript types
│   └── hooks/                    # Custom React hooks
│
├── backend/                       # Python Backend
│   ├── server.py                 # FastAPI server
│   ├── config.py                 # Configuration (msgspec)
│   ├── models.py                 # Data models
│   ├── prompts.py                # LLM prompts
│   ├── memory/
│   │   └── core.py              # Main Memory class (1200+ lines)
│   ├── embeddings/
│   │   └── gemini.py            # Gemini embeddings
│   ├── llm/
│   │   └── mistral.py           # Mistral LLM
│   ├── graph/
│   │   └── kuzu.py              # Knowledge graph (675 lines)
│   └── storage/
│       ├── sqlite.py            # History storage
│       └── vector.py            # Vector storage
│
└── docs/                          # Documentation
```

---

## 🚀 API Endpoints

### POST `/chat`

Send a message and receive an AI response with memory context.

**Request:**
```json
{
  "message": "I'm learning Python for AI development",
  "user_id": "user_123",
  "system_prompt": "You are a helpful assistant"
}
```

**Response:**
```json
{
  "response": "That's great! Since you mentioned earlier you're interested in machine learning...",
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
      "source": "user_123",
      "relationship": "learning",
      "destination": "python"
    }
  ]
}
```

### GET `/memories?user_id={userId}`

Retrieve all memories for a user.

### DELETE `/memories?user_id={userId}`

Clear all memories for a user.

### GET `/health`

Health check endpoint.

---

## 🔐 Security & Privacy

1. **User Isolation:** Memories are strictly filtered by `user_id`
2. **Local Storage:** All data stored locally using SQLite and Kuzu (embedded databases)
3. **API Key Management:** Environment variables for sensitive keys
4. **Session-based Auth:** Simple password protection with cookie-based sessions

---

## 📊 Performance Characteristics

| Operation | Latency | Notes |
|-----------|---------|-------|
| Message + Memory Search | ~500ms | Parallel embedding + search |
| Memory Addition | ~300ms | Async fact extraction |
| Graph Search | ~100ms | BM25 re-ranking |
| Embedding Generation | ~50ms | Gemini API call |

---

## 🎨 UI/UX Highlights

- **Modern Glass Morphism Design** with subtle gradients
- **Dark/Light Theme Toggle** using next-themes
- **Smooth Animations** powered by Motion (Framer Motion)
- **Responsive Layout** with collapsible sidebar
- **Memory Badges** showing which memories influenced responses
- **Markdown Support** with syntax highlighting in chat
- **Typing Indicators** with animated dots

---

## 📦 Dependencies Summary

### Frontend (Node.js)
```json
{
  "next": "16.1.1",
  "react": "19.2.3",
  "tailwindcss": "^4",
  "motion": "^12.23.26",
  "lucide-react": "^0.562.0",
  "react-markdown": "^10.1.0"
}
```

### Backend (Python)
```toml
[dependencies]
fastapi = ">=0.115.0"
google-genai = ">=1.56.0"
kuzu = ">=0.11.3"
msgspec = ">=0.20.0"
aiosqlite = ">=0.22.1"
rank-bm25 = ">=0.2.2"
```

---

## 🔮 Innovation Summary

| Innovation | Description |
|------------|-------------|
| **Dual Memory Architecture** | Combines vector similarity with graph relationships |
| **Structured Fact Extraction** | LLM classifies memories by type (decision, preference, plan) |
| **Decision Context Capture** | Preserves goals, alternatives, reasoning, and emotional state |
| **Intelligent Memory Management** | Auto UPDATE/DELETE conflicting memories |
| **Changelog Tracking** | Maintains history of memory changes |
| **Relevance Filtering** | Threshold-based filtering eliminates noise |
| **Knowledge Graph Relations** | Entity-relationship mapping for contextual reasoning |

---

*Document Version: 1.0*  
*Last Updated: January 4, 2026*
