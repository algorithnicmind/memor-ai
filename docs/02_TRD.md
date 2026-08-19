# Technical Requirements Document (TRD)

## 1. System Overview
Memorai is a decoupled application separating the memory engine from the LLM generation process. The backend orchestrates memory extraction, storage, and retrieval before constructing a context prompt for the LLM.

## 2. Technology Stack

### 2.1. Frontend
- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context / Zustand (as needed)

### 2.2. Backend API
- **Framework**: FastAPI (Python)
- **Data Validation**: Pydantic
- **API Architecture**: RESTful endpoints

### 2.3. Memory & Database Layer
- **Relational DB**: SQLite (for Users, Conversations, Messages, Memory metadata)
- **Vector DB**: ChromaDB / Qdrant / FAISS (for embedding storage and semantic search)
- **Graph DB**: Kuzu (for entity-relationship mapping)

### 2.4. AI & Machine Learning
- **Offline/Local Mode**:
  - LLM: Local models via Ollama / Llama.cpp (e.g., Llama 3 8B, Mistral)
  - Embeddings: Local models (e.g., all-MiniLM-L6-v2)
- **Online/Cloud Mode**:
  - LLM: Mistral API / Gemini API
  - Embeddings: Cloud embedding endpoints

## 3. Core Functional Requirements
- **Authentication**: Secure JWT/session-based authentication to isolate user memories.
- **Memory Extraction Pipeline**: NLP/LLM-based pipeline to classify and extract JSON objects from text.
- **Scoring Engine**: Algorithm to rank memories based on Semantic Similarity, Importance, Recency, Relationship Strength, and Confidence.

## 4. Non-Functional Requirements
- **Latency**: Memory retrieval and context building should add <500ms to the LLM response time.
- **Privacy**: User data must be strictly isolated. Local mode must not send data to external APIs.
- **Hardware Constraints (Local Mode)**: Must run on a machine with an RTX 2050 4GB + 16GB RAM.

## 5. Security & Access Control
- Passwords must be hashed (bcrypt).
- API routes must be protected via authentication middleware.
- Users can only read/write/delete their own memories (`user_id` filtering).
