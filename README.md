# Memorai

**An AI Companion That Actually Remembers You**

Memorai is a specialized AI assistant with persistent, structured memory. It learns important information about a user, connects related concepts, remembers previous decisions and preferences, and uses that knowledge to provide personalized responses across conversations. It builds an evolving understanding of its user rather than just acting as a stateless chatbot.

## Core Philosophy

The Large Language Model (LLM) is merely the generation engine. **The real product is the memory architecture surrounding it.**

- **Talk** → **Extract** → **Classify** → **Store** → **Connect** → **Retrieve** → **Rank** → **Personalize** → **Update** → **Evolve**

## Architecture Principles

| Principle | Description |
|-----------|-------------|
| **SOLID** | Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion |
| **Clean Code** | Meaningful names, small functions, single responsibility, DRY, KISS, YAGNI |
| **Hybrid Monorepo** | Unified repository with microservices for future scaling |

## Architecture Overview

Memorai operates on a dual-retrieval memory system:

1. **Semantic Memory (Vector DB)**: Fuzzy matching for preferences, plans, and facts
2. **Relational Memory (Knowledge Graph)**: Explicit relationships between extracted entities

When a user asks a question, Memorai merges relevant semantic memories and graph connections, ranks them by importance and confidence, and builds a robust context prompt for the LLM.

## Repository Structure

```text
memor-ai/
├── frontend/                # Next.js Application (React + TypeScript)
├── backend/                 # FastAPI Application (Python)
├── services/                # Microservices (Future scaling)
├── shared/                  # Shared types, utilities, contracts
├── infrastructure/          # Docker, CI/CD, deployment configs
├── docs/                    # Architectural documentation
├── docker-compose.yml       # Local development orchestration
└── README.md                # Main project overview
```

### Frontend (Clean Architecture)

```text
frontend/src/
├── app/           # Next.js App Router pages
├── components/    # Reusable React components
├── hooks/         # Custom React hooks
├── lib/           # API clients and utilities
├── store/         # State management (Zustand)
└── types/         # TypeScript type definitions
```

### Backend (SOLID + Clean Architecture)

```text
backend/app/
├── api/           # API Layer (Controllers + Routes)
├── engine/        # Business Logic Layer (Extractor, Classifier, Scorer)
├── db/            # Data Access Layer (SQLite, ChromaDB, Kuzu)
├── core/          # Cross-cutting concerns (Config, Security, LLM)
├── schemas/       # Pydantic models (Request/Response validation)
└── utils/         # Utility functions
```

## Documentation

Comprehensive documentation can be found in the `docs/` directory:

1. [PRD (Product Requirements)](docs/01_PRD.md)
2. [TRD (Technical Requirements)](docs/02_TRD.md)
3. [Architecture](docs/03_Architecture.md)
4. [High-Level Design (HLD)](docs/04_HLD.md)
5. [Low-Level Design (LLD)](docs/05_LLD.md)
6. [Data Flow Diagrams (DFD)](docs/06_DFD.md)
7. [Wireframes](docs/07_Wireframes.md)
8. [Master TODO](docs/08_MASTER_TODO.md)
9. [Project Structure](docs/09_Project_Structure.md)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js + React + TypeScript | User interface |
| Styling | Tailwind CSS | Responsive design |
| State | Zustand | Client-side state management |
| Backend | FastAPI + Python | API server |
| Relational DB | SQLite | Users, conversations, messages |
| Vector DB | ChromaDB / Qdrant | Semantic search |
| Graph DB | Kuzu | Entity relationships |
| LLM (Local) | Ollama / Llama.cpp | Offline inference |
| LLM (Cloud) | Mistral / Gemini API | Fallback inference |
| Embeddings | sentence-transformers | Local embeddings |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/username/memor-ai.git
cd memor-ai

# Start development
make dev

# Run tests
make test

# Build for production
make build
```

## Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Foundation & Setup | Not Started |
| Phase 2 | Core Memory Engine | Not Started |
| Phase 3 | Vector & Graph Integration | Not Started |
| Phase 4 | Context Building & UI Polish | Not Started |
| Phase 5 | Testing & Optimization | Not Started |
| Phase 6 | Microservices Extraction | Future |

See [Master TODO](docs/08_MASTER_TODO.md) for detailed tasks.

## License

CC0 1.0 Universal - Public Domain
