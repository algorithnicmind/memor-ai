# 📋 Memorai - Team Task Tracker

> **Quick reference for daily work - Check off tasks as you complete them!**
>
> _Last Updated: February 2, 2026_

---

## 🎯 Quick Links

| Document                                                   | Purpose                        |
| ---------------------------------------------------------- | ------------------------------ |
| [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md)                 | Full project roadmap & details |
| [HACKATHON_PITCH.md](./HACKATHON_PITCH.md)                 | Presentation deck              |
| [HOW_IT_WORKS.md](./HOW_IT_WORKS.md)                       | Simple explanation             |
| [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) | Technical specs                |
| [TECH_STACK.md](./TECH_STACK.md)                           | Technology choices             |

---

## 👤 Task Assignment

_Fill in team member names next to each section_

| Role              | Assigned To        | Focus Area            |
| ----------------- | ------------------ | --------------------- |
| 🎨 Frontend Lead  | **\*\***\_**\*\*** | UI/UX, React, Styling |
| ⚙️ Backend Lead   | **\*\***\_**\*\*** | API, Memory Engine    |
| 🧠 AI/ML Engineer | **\*\***\_**\*\*** | LLM, Embeddings       |
| 📊 Integration/QA | **\*\***\_**\*\*** | Testing, Integration  |

---

## ✅ Master Task Checklist

### 🔷 PHASE 1: Project Setup

#### Day 1-2: Environment Setup

- [ ] **1.1** Clone/Initialize repository
- [ ] **1.2** Create folder structure:
  ```
  Memorai/
  ├── frontend/
  ├── backend/
  └── docs/ ✅ (Already done)
  ```
- [ ] **1.3** Set up `.gitignore` files
- [ ] **1.4** Create branch for development

#### Day 2-3: Frontend Initialization

- [ ] **1.5** Initialize Next.js project
  ```bash
  cd frontend
  npx -y create-next-app@latest ./ --typescript --tailwind --app --src-dir
  ```
- [ ] **1.6** Install core dependencies:
  ```bash
  npm install motion lucide-react @radix-ui/react-avatar @radix-ui/react-scroll-area
  npm install react-markdown remark-gfm next-themes
  npm install class-variance-authority clsx tailwind-merge
  ```
- [ ] **1.7** Create `frontend/.env.local` with:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```
- [ ] **1.8** Test frontend runs: `npm run dev`

#### Day 2-3: Backend Initialization

- [ ] **1.9** Create Python virtual environment:
  ```bash
  cd backend
  python -m venv venv
  .\venv\Scripts\activate  # Windows
  ```
- [ ] **1.10** Install dependencies:
  ```bash
  pip install fastapi uvicorn google-genai kuzu msgspec openai pydantic python-dotenv rank-bm25 aiosqlite
  ```
- [ ] **1.11** Create `backend/.env` with:
  ```env
  GOOGLE_API_KEY=your_key_here
  MISTRAL_API_KEY=your_key_here
  ```
- [ ] **1.12** Create basic `server.py` with health check
- [ ] **1.13** Test backend runs: `uvicorn server:app --reload`

---

### 🔷 PHASE 2: Core Development

#### Backend Tasks (Days 4-8)

##### 2A: Core Structure

- [ ] **2A.1** Create `config.py` - Configuration settings
- [ ] **2A.2** Create `models.py` - Pydantic data models
- [ ] **2A.3** Create `prompts.py` - LLM prompts

##### 2B: Storage Layer

- [ ] **2B.1** Create `storage/vector.py`:
  - [ ] Initialize SQLite database
  - [ ] Create vectors table
  - [ ] Implement `insert_vector()`
  - [ ] Implement `search_similar()` with cosine similarity
  - [ ] Implement `delete_vector()`

- [ ] **2B.2** Create `storage/sqlite.py`:
  - [ ] Chat history storage
  - [ ] Session management

##### 2C: AI Services

- [ ] **2C.1** Create `embeddings/gemini.py`:
  - [ ] Initialize Gemini client
  - [ ] Implement `embed_text()` function
  - [ ] Handle API errors

- [ ] **2C.2** Create `llm/mistral.py`:
  - [ ] Initialize Mistral client (via OpenAI SDK)
  - [ ] Implement `generate_response()`
  - [ ] Implement `extract_facts()` for memory extraction

##### 2D: Knowledge Graph

- [ ] **2D.1** Create `graph/kuzu.py`:
  - [ ] Initialize Kuzu database
  - [ ] Create Entity node schema
  - [ ] Create CONNECTED_TO relationship schema
  - [ ] Implement `add_entity()`
  - [ ] Implement `add_relationship()`
  - [ ] Implement `search_graph()`
  - [ ] Implement BM25 re-ranking

##### 2E: Memory Engine (THE BRAIN)

- [ ] **2E.1** Create `memory/core.py`:
  - [ ] Initialize Memory class
  - [ ] Implement `add_memory()`:
    - Extract facts from message
    - Generate embedding
    - Check for duplicates (hash)
    - Store in vector DB
    - Add to knowledge graph
  - [ ] Implement `search_memories()`:
    - Embed query
    - Search vector DB
    - Search knowledge graph
    - Combine results
  - [ ] Implement `update_memory()` for conflicts
  - [ ] Implement `delete_memory()`
  - [ ] Implement `get_all_memories()`

##### 2F: API Endpoints

- [ ] **2F.1** Complete `server.py`:
  - [ ] `POST /chat` endpoint:
    - Accept message + user_id
    - Search relevant memories
    - Get graph relationships
    - Build context
    - Generate response
    - Extract & save new memories
    - Return response + memories used
  - [ ] `GET /memories` endpoint:
    - Accept user_id
    - Return all memories for user
  - [ ] `DELETE /memories` endpoint:
    - Accept user_id
    - Clear all memories
  - [ ] `GET /health` endpoint

---

#### Frontend Tasks (Days 4-8)

##### 3A: Core Structure

- [ ] **3A.1** Set up app layout (`app/layout.tsx`)
- [ ] **3A.2** Create global styles (`app/globals.css`)
- [ ] **3A.3** Set up theme provider (next-themes)
- [ ] **3A.4** Create types file (`lib/types.ts`)

##### 3B: UI Components

- [ ] **3B.1** Create `components/ui/button.tsx`
- [ ] **3B.2** Create `components/ui/input.tsx`
- [ ] **3B.3** Create `components/ui/card.tsx`
- [ ] **3B.4** Create `components/ui/avatar.tsx`

##### 3C: Chat Components

- [ ] **3C.1** Create `components/chat/chat-interface.tsx`:
  - Chat container layout
  - Message list scroll area
  - Input area at bottom
- [ ] **3C.2** Create `components/chat/message-bubble.tsx`:
  - User message styling
  - AI message styling
  - Markdown rendering
  - Memory badges display
- [ ] **3C.3** Create `components/chat/chat-input.tsx`:
  - Text input field
  - Send button
  - Enter to send functionality
- [ ] **3C.4** Create `components/chat/memory-sidebar.tsx`:
  - Collapsible sidebar
  - List of memories
  - Memory type badges
- [ ] **3C.5** Create `components/chat/typing-indicator.tsx`:
  - Animated dots
  - Show while waiting for response

##### 3D: Pages

- [ ] **3D.1** Create login page (`app/page.tsx`):
  - Password input
  - Login button
  - Redirect to chat on success
- [ ] **3D.2** Create chat page (`app/(chat)/chat/page.tsx`):
  - Integrate ChatInterface component
  - Manage chat state
  - Handle API calls

##### 3E: API Client

- [ ] **3E.1** Create `lib/api.ts`:
  - `sendMessage()` function
  - `getMemories()` function
  - `clearMemories()` function
  - Error handling

##### 3F: Styling & Animations

- [ ] **3F.1** Implement dark/light theme toggle
- [ ] **3F.2** Add glass morphism effects
- [ ] **3F.3** Add smooth transitions (Motion)
- [ ] **3F.4** Make responsive for all screen sizes

---

### 🔷 PHASE 3: Integration & Testing (Days 9-11)

#### Integration Tasks

- [ ] **4.1** Connect frontend to backend API
- [ ] **4.2** Test full chat flow
- [ ] **4.3** Verify memories persist across sessions
- [ ] **4.4** Test knowledge graph relationships
- [ ] **4.5** Handle loading states properly
- [ ] **4.6** Implement error handling/messages

#### Testing Checklist

- [ ] **4.7** Memory creation works
- [ ] **4.8** Memory retrieval works
- [ ] **4.9** No duplicate memories created
- [ ] **4.10** Memory updates on conflict
- [ ] **4.11** User isolation works (memories per user)
- [ ] **4.12** Knowledge graph relations work
- [ ] **4.13** UI responsive on mobile

---

### 🔷 PHASE 4: Polish & Demo Prep (Days 12-14)

#### Bug Fixes

- [ ] **5.1** Fix critical bugs discovered in testing
- [ ] **5.2** Performance optimization
- [ ] **5.3** UI polish and visual fixes

#### Demo Preparation

- [ ] **5.4** Create demo script (what to show)
- [ ] **5.5** Prepare sample conversation flow:
  - Introduce yourself to AI
  - Ask questions that use memory
  - Show memory persistence
  - Demonstrate knowledge graph
- [ ] **5.6** Test demo start to finish
- [ ] **5.7** Prepare backup plan for failures
- [ ] **5.8** Review presentation (HACKATHON_PITCH.md)

---

## 📊 Progress Tracker

| Phase                | Status         | % Complete |
| -------------------- | -------------- | ---------- |
| Phase 1: Setup       | ⬜ Not Started | 0%         |
| Phase 2: Backend     | ⬜ Not Started | 0%         |
| Phase 2: Frontend    | ⬜ Not Started | 0%         |
| Phase 3: Integration | ⬜ Not Started | 0%         |
| Phase 4: Polish      | ⬜ Not Started | 0%         |

**Overall Progress: [ ]%**

---

## 🔥 Priority Tasks (Do These First!)

### Critical Path (MVP Requirements)

1. ⬜ Backend: Basic `/chat` endpoint working
2. ⬜ Backend: Memory storage (vector DB)
3. ⬜ Backend: Memory retrieval
4. ⬜ Frontend: Chat interface
5. ⬜ Frontend: API integration
6. ⬜ Integration: Full chat with memory flow

### Nice to Have (If Time Permits)

- ⬜ Knowledge graph visualization
- ⬜ Memory export feature
- ⬜ Streaming responses
- ⬜ Advanced animations

---

## 📝 Daily Notes

### Day 1 Notes

```
Date: _____________
What was done:

Blockers:

Tomorrow's plan:
```

### Day 2 Notes

```
Date: _____________
What was done:

Blockers:

Tomorrow's plan:
```

### Day 3 Notes

```
Date: _____________
What was done:

Blockers:

Tomorrow's plan:
```

_(Add more as needed)_

---

## 🆘 Common Issues & Solutions

| Issue                   | Solution                                     |
| ----------------------- | -------------------------------------------- |
| API key not working     | Double-check `.env` file, restart server     |
| CORS error              | Add CORS middleware to FastAPI               |
| Port already in use     | Kill process on port or use different port   |
| Memory not persisting   | Check database file path and permissions     |
| Frontend not connecting | Verify `NEXT_PUBLIC_API_URL` matches backend |

---

## 🎉 Celebration Checkpoints

- [ ] 🎊 First successful chat message!
- [ ] 🎊 First memory created!
- [ ] 🎊 Memory recalled in conversation!
- [ ] 🎊 Knowledge graph working!
- [ ] 🎊 Full demo working end-to-end!
- [ ] 🎊 Hackathon presentation complete!

---

_Good luck team! Let's build something amazing! 🚀_
