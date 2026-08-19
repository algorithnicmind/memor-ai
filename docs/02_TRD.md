# Technical Requirements Document (TRD)

## 1. System Overview
Memorai is an advanced AI chat application that solves memory loss between conversations using a dual-memory architecture combining Vector-based semantic memory and Knowledge graph storage.

## 2. Technology Stack

### 2.1. Frontend Technologies
- **Framework**: Next.js 16.1.1 (App Router, SSR)
- **React**: React 19.2.3 (Concurrent features)
- **Language**: TypeScript ^5
- **Styling**: Tailwind CSS ^4, `@tailwindcss/typography`
- **Animations**: Motion (Framer Motion) 12.23.26
- **UI Components**: Radix UI (Accessible primitives), Lucide React 0.562.0 (Icons)
- **Content Rendering**: `react-markdown` 10.1.0, `remark-gfm`

### 2.2. Backend Technologies
- **Framework**: FastAPI (Python >= 3.12)
- **Server**: Uvicorn >= 0.34.0
- **Validation**: Pydantic >= 2.10.0
- **Serialization**: `msgspec` >= 0.20.0

### 2.3. AI & Machine Learning Services
- **Chat LLM**: Mistral AI (via `openai` SDK >= 2.14.0)
- **Embeddings**: Google Gemini (`google-genai` >= 1.56.0) using `text-embedding-004` (768-dimensional vectors)
- **Text Ranking**: `rank-bm25` >= 0.2.2 (Re-ranks graph search results)

### 2.4. Database & Storage Layer (Embedded Architecture)
- **Vector Storage**: **SQLite** (via `aiosqlite` >= 0.22.1). Uses custom cosine similarity. Implements a relevance threshold filtering (default 0.5) to eliminate noise and supports metadata-based filtering (user_id, agent_id, run_id).
- **Graph Storage**: **Kuzu** >= 0.11.3. Embedded graph database for storing entity relationships natively in-process.

## 3. UI/UX Highlights
- Modern **Glass Morphism Design** with subtle gradients.
- **Dark/Light Theme Toggle** using `next-themes`.
- **Smooth Animations** powered by Motion.
- **Memory Badges** showing which memories influenced responses.
- **Typing Indicators** with animated dots.
- **Markdown Support** with syntax highlighting.

## 4. Performance Characteristics
- **Message + Memory Search**: ~500ms (Parallel embedding + search)
- **Memory Addition**: ~300ms (Async fact extraction)
- **Graph Search**: ~100ms (BM25 re-ranking)
- **Embedding Generation**: ~50ms (Gemini API call)

## 5. Security & Privacy
- **User Isolation**: Memories strictly filtered by `user_id`.
- **Local Storage**: All data stored locally using embedded SQLite and Kuzu.
- **Session-based Auth**: Password protection with cookie-based sessions.
