# Memorai - How It Works

> A simple guide for team members to understand the project

---

## 🎯 What is Memorai?

Memorai is an **AI chatbot that remembers everything you tell it**. Unlike regular chatbots (even ChatGPT itself), our bot:

- Remembers facts about you across sessions
- Understands relationships between things ("John works at Google")
- Tracks your decisions and why you made them
- Gets smarter the more you talk to it

---

## 🏠 Project Structure

```
Memorai/
├── frontend/          ← Next.js web app (what users see)
├── backend/           ← Python API (the brain)
└── docs/              ← Documentation
```

---

## 🔄 How a Message Flows Through the System

When a user sends a message, here's what happens step by step:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. USER SENDS MESSAGE                                          │
│     "What programming language should I learn?"                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. SEARCH FOR RELEVANT MEMORIES                                │
│                                                                 │
│  We look in TWO places:                                         │
│                                                                 │
│  📦 Vector Database (SQLite)          🕸️ Knowledge Graph (Kuzu) │
│  ├── "User likes Python"              ├── user → interested_in → AI │
│  ├── "User is learning ML"            ├── Python → good_for → ML    │
│  └── "User prefers dark mode"         └── user → works_at → startup │
│                                                                 │
│  → Finds memories with similar meaning │→ Finds connected concepts│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. BUILD CONTEXT FOR THE AI                                    │
│                                                                 │
│  We tell Mistral:                                               │
│  "Here's what you know about this user:                         │
│   - They're interested in AI/ML                                 │
│   - They like Python                                            │
│   - They work at a startup                                      │
│   Now answer their question about programming languages."       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. AI GENERATES PERSONALIZED RESPONSE                          │
│                                                                 │
│  "Based on your interest in AI/ML, I'd recommend Python!        │
│   It has the best libraries for machine learning like           │
│   TensorFlow and PyTorch, which fits your goals perfectly."     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. EXTRACT & SAVE NEW MEMORIES                                 │
│                                                                 │
│  From the conversation, we might save:                          │
│  - "User is considering learning a new programming language"    │
│  - Add relationship: user → considering → programming_language  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 The Two Memory Systems

### 1. Vector Memory (SQLite)
**What it stores:** Facts as text with embeddings (numbers that represent meaning)

**How it works:**
1. Take a sentence like "I love pizza"
2. Convert it to a list of 768 numbers using Gemini AI
3. Store both the text and numbers in SQLite
4. When searching, convert the query to numbers and find similar ones

**Example:**
```
Query: "What food do I like?"
        ↓ (converted to numbers)
[0.23, -0.45, 0.12, ...768 numbers]
        ↓ (find similar vectors)
Match: "User loves pizza" (similarity: 0.89)
```

### 2. Knowledge Graph (Kuzu)
**What it stores:** Relationships between things

**How it works:**
```
[Person: John] --works_at--> [Company: Google]
[Person: John] --likes--> [Food: Pizza]
[Language: Python] --good_for--> [Field: AI]
```

When you ask about John, we can traverse the graph to find related info.

---

## 📁 Key Files Explained

### Backend (Python)

| File | What It Does |
|------|--------------|
| `server.py` | The API endpoints (`/chat`, `/memories`, `/health`) |
| `memory/core.py` | **The main brain** - handles all memory operations |
| `embeddings/gemini.py` | Converts text → numbers using Google's AI |
| `llm/mistral.py` | Talks to Mistral AI for chat responses |
| `storage/vector.py` | Stores and searches vector embeddings |
| `graph/kuzu.py` | Manages the knowledge graph |
| `prompts.py` | All the prompts we send to the AI |
| `config.py` | Settings and configuration |

### Frontend (Next.js)

| Folder | What It Does |
|--------|--------------|
| `app/page.tsx` | Landing/login page |
| `app/(chat)/chat/` | The main chat interface |
| `components/chat/` | Chat UI components (messages, input, etc.) |
| `components/ui/` | Reusable UI components (buttons, inputs) |

---

## 🔧 Core Technologies (Simple Explanation)

### Frontend
| Tech | What It Does |
|------|--------------|
| **Next.js** | React framework that makes fast websites |
| **Tailwind CSS** | CSS framework for styling (no writing raw CSS) |
| **Motion** | Makes things animate smoothly |

### Backend
| Tech | What It Does |
|------|--------------|
| **FastAPI** | Makes our Python code into an API |
| **SQLite** | Simple database stored in a single file |
| **Kuzu** | Graph database for relationships |

### AI Services
| Tech | What It Does |
|------|--------------|
| **Mistral AI** | The LLM that generates chat responses |
| **Gemini** | Converts text to numbers (embeddings) for search |

---

## 💡 Key Concepts

### What are Embeddings?
Embeddings turn text into numbers that capture meaning. Similar sentences have similar numbers.

```
"I love dogs" → [0.1, 0.5, -0.3, ...]
"I adore puppies" → [0.12, 0.48, -0.28, ...]  ← Very similar!
"The weather is nice" → [-0.8, 0.1, 0.9, ...]  ← Very different
```

### What is Cosine Similarity?
A math formula that tells us how similar two lists of numbers are. Score from 0 (different) to 1 (identical).

### What is a Knowledge Graph?
A database that stores things and their relationships, like a mind map:
- Nodes = Things (people, places, concepts)
- Edges = Relationships (works_at, likes, created_by)

---

## 🔐 How Authentication Works

1. User enters password on login page
2. If correct, we set a cookie with user ID
3. All API calls include this user ID
4. Memories are filtered by user ID (you only see your own)

Currently it's simple password auth - good for demo, not production.

---

## 📊 Memory Types

When we save memories, we classify them:

| Type | Description | Example |
|------|-------------|---------|
| `simple` | Basic facts | "User's name is John" |
| `decision` | Choices made | "Chose Python over Java" |
| `preference` | Likes/dislikes | "Prefers dark mode" |
| `plan` | Future intentions | "Planning to learn Rust" |

For **decisions**, we also save extra context:
- What was the goal?
- What were the alternatives?
- Why did they choose this?
- How confident were they?

---

## 🚀 How to Run Locally

### Backend
```bash
cd backend
pip install -e .          # Install dependencies
uvicorn server:app --reload  # Start server on localhost:8000
```

### Frontend
```bash
cd frontend
npm install               # Install dependencies
npm run dev               # Start on localhost:3000
```

### Environment Variables Needed
```
# backend/.env
GOOGLE_API_KEY=xxx        # For Gemini embeddings
MISTRAL_API_KEY=xxx       # For chat responses
```

---

## 🔄 API Endpoints

| Endpoint | Method | What It Does |
|----------|--------|--------------|
| `/chat` | POST | Send message, get response with memory context |
| `/memories` | GET | Get all memories for a user |
| `/memories` | DELETE | Clear all memories for a user |
| `/health` | GET | Check if server is running |

### Example Chat Request
```json
POST /chat
{
  "message": "What should I learn next?",
  "user_id": "user_123"
}
```

### Example Response
```json
{
  "response": "Based on your interest in AI, I'd suggest...",
  "memories_used": [
    {"memory": "User likes Python", "score": 0.85}
  ],
  "relations_used": [
    {"source": "user", "relationship": "interested_in", "destination": "AI"}
  ]
}
```

---

## 🎯 What Makes This Project Special

1. **Dual Memory System** - Combines fast similarity search with relationship understanding
2. **Automatic Fact Extraction** - AI extracts and saves important info from conversations
3. **Decision Tracking** - Remembers not just what you decided, but why
4. **Deduplication** - Doesn't save the same thing twice
5. **Conflict Resolution** - Updates old info when you tell it something new

---

## ❓ Common Questions

**Q: Where is the data stored?**
A: In local files - `api_vectors.db` (memories) and `api_graph/` folder (relationships)

**Q: How do we prevent duplicate memories?**
A: We hash each memory and check if it already exists before saving

**Q: What happens if info changes?**
A: When you say "I moved to NYC" but we have "lives in LA", the AI detects the conflict and updates the memory

**Q: How do we know which memories are relevant?**
A: We use a similarity threshold (0.5 by default) - only memories above this score are used

---

## 🛠️ Want to Improve Something?

| Area | File to Edit |
|------|--------------|
| Change AI prompts | `backend/prompts.py` |
| Modify memory logic | `backend/memory/core.py` |
| Update chat UI | `frontend/components/chat/` |
| Add new API endpoint | `backend/server.py` |
| Change styling | `frontend/app/globals.css` |

---

*Questions? Ask the team or check the code comments!*
