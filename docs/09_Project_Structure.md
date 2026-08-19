# Project Structure

This document outlines the planned folder and file structure for the Memorai repository. This structure follows a **Hybrid Monorepo with Microservices** architecture, applying **SOLID principles** and **Clean Code conventions** by Robert C. Martin (Uncle Bob).

---

## Architecture Principles

### SOLID Principles Applied

| Principle | Application |
|-----------|-------------|
| **Single Responsibility** | Each service/module has one reason to change |
| **Open/Closed** | Engine interfaces allow extension without modification |
| **Liskov Substitution** | Database clients (SQLite, ChromaDB, Kuzu) are interchangeable |
| **Interface Segregation** | Small, focused interfaces (IExtractor, IClassifier, IScorer) |
| **Dependency Inversion** | High-level modules depend on abstractions, not concretions |

**Example - Interface Segregation (ISP):**
```python
# BAD: Fat interface
class IMemoryService(ABC):
    async def extract(self, message): pass
    async def classify(self, memory): pass
    async def score(self, memory): pass
    async def store(self, memory): pass

# GOOD: Segregated interfaces
class IExtractor(ABC):
    async def extract(self, message): pass

class IClassifier(ABC):
    async def classify(self, memory): pass

class IScorer(ABC):
    async def score(self, memory): pass
```

**Example - Dependency Inversion (DIP):**
```python
# Abstraction
class IRelationalDB(ABC):
    @abstractmethod
    async def query(self, sql: str) -> List: pass

# High-level module depends on abstraction
class MemoryRepository:
    def __init__(self, db: IRelationalDB):
        self._db = db

# Low-level module implements abstraction
class SQLiteClient(IRelationalDB):
    async def query(self, sql: str) -> List:
        return await self._sqlite.query(sql)
```

### Clean Code Conventions

| Convention | Description | Example |
|-----------|-------------|---------|
| **Meaningful Names** | Variables, functions, and classes reveal intent | `memory_id` not `id` |
| **Small Functions** | Each function does one thing and does it well | 5-15 lines max |
| **Single Responsibility** | Classes have one reason to change | `FactExtractor` only extracts |
| **DRY** | Don't Repeat Yourself | Extract common logic |
| **KISS** | Keep It Simple, Stupid | Avoid over-engineering |
| **YAGNI** | You Aren't Gonna Need It | Build what you need now |

**Example - Meaningful Names:**
```python
# BAD
def calc(a, b):
    return a * b

# GOOD
def calculate_area(width: float, height: float) -> float:
    return width * height
```

**Example - Small Functions:**
```python
# BAD: Long function
async def process_message(message: str) -> Memory:
    # ... 50 lines of code ...

# GOOD: Small, focused functions
async def process_message(message: str) -> Memory:
    facts = await extract_facts(message)
    entities = await extract_entities(message)
    memory_type = classify_memory(facts, entities)
    importance = calculate_importance(facts, entities)
    return create_memory(facts, entities, memory_type, importance)
```

---

## Root Directory (Monorepo)

```text
memor-ai/
├── frontend/                    # Next.js Application (React + TypeScript)
├── backend/                     # FastAPI Application (Python)
├── services/                    # Microservices (Future scaling)
├── shared/                      # Shared types, utilities, contracts
├── infrastructure/              # Docker, CI/CD, deployment configs
├── docs/                        # Architectural documentation
├── docker-compose.yml           # Local development orchestration
├── docker-compose.prod.yml      # Production deployment
├── Makefile                     # Common commands (dev, test, build)
└── README.md                    # Main project overview
```

---

## Frontend Structure (Next.js + Clean Architecture)

```text
frontend/
├── public/                      # Static assets (images, icons)
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── chat/                # Chat interface page
│   │   │   └── page.tsx         # Chat page component
│   │   ├── dashboard/           # Memory dashboard page
│   │   │   └── page.tsx         # Dashboard page component
│   │   ├── layout.tsx           # Global layout wrapper
│   │   └── page.tsx             # Home page
│   │
│   ├── components/              # Reusable React components
│   │   ├── chat/                # Chat-specific components
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── ChatContainer.tsx
│   │   ├── memory/              # Memory dashboard components
│   │   │   ├── MemoryCard.tsx
│   │   │   ├── GraphVisualizer.tsx
│   │   │   └── MemoryTimeline.tsx
│   │   └── ui/                  # Generic UI components
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Alert.tsx
│   │       └── Loading.tsx
│   │
│   ├── lib/                     # API clients and utilities
│   │   ├── api/                 # API client functions
│   │   │   ├── chatClient.ts
│   │   │   ├── memoryClient.ts
│   │   │   └── authClient.ts
│   │   └── utils/               # Helper functions
│   │       ├── formatters.ts
│   │       └── validators.ts
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useChat.ts
│   │   ├── useMemory.ts
│   │   └── useAuth.ts
│   │
│   ├── store/                   # State management (Zustand)
│   │   ├── chatStore.ts
│   │   ├── memoryStore.ts
│   │   └── authStore.ts
│   │
│   └── types/                   # TypeScript type definitions
│       ├── chat.ts
│       ├── memory.ts
│       └── api.ts
│
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── next.config.js               # Next.js configuration
├── package.json                 # Node dependencies
└── .env.example                 # Environment variables template
```

---

## Backend Structure (FastAPI + Clean Architecture)

```text
backend/
├── app/
│   ├── api/                     # API Layer (Controllers)
│   │   ├── routes/              # Route handlers
│   │   │   ├── chat.py          # POST /chat endpoints
│   │   │   ├── memory.py        # CRUD /memory endpoints
│   │   │   ├── user.py          # Auth /user endpoints
│   │   │   └── health.py        # GET /health endpoint
│   │   ├── dependencies.py      # FastAPI dependencies
│   │   │   └── Dependencies.py  # get_db, get_current_user
│   │   └── middleware/          # Request middleware
│   │       ├── auth.py          # JWT authentication
│   │       └── logging.py       # Request logging
│   │
│   ├── engine/                  # Business Logic Layer
│   │   ├── interfaces/          # Abstract interfaces (SOLID: ISP)
│   │   │   ├── IExtractor.py
│   │   │   ├── IClassifier.py
│   │   │   ├── IScorer.py
│   │   │   └── IRetriever.py
│   │   │
│   │   ├── extractor/           # Memory extraction (SRP)
│   │   │   ├── FactExtractor.py
│   │   │   ├── EntityExtractor.py
│   │   │   └── extractor_prompts.py
│   │   │
│   │   ├── classifier/          # Memory classification (SRP)
│   │   │   ├── MemoryClassifier.py
│   │   │   ├── TypeDetector.py
│   │   │   └── classifier_rules.py
│   │   │
│   │   ├── scorer/              # Memory scoring (SRP)
│   │   │   ├── ImportanceScorer.py
│   │   │   ├── ConfidenceScorer.py
│   │   │   └── RecencyScorer.py
│   │   │
│   │   ├── retriever/           # Dual retrieval (SRP)
│   │   │   ├── SemanticRetriever.py
│   │   │   ├── RelationalRetriever.py
│   │   │   ├── ContextBuilder.py
│   │   │   └── MemoryRanker.py
│   │   │
│   │   └── pipeline/            # Orchestration (OCP)
│   │       ├── MemoryPipeline.py
│   │       └── PipelineStep.py
│   │
│   ├── db/                      # Data Access Layer (DIP)
│   │   ├── interfaces/          # Database abstractions
│   │   │   ├── IRelationalDB.py
│   │   │   ├── IVectorDB.py
│   │   │   └── IGraphDB.py
│   │   │
│   │   ├── relational/          # SQLite implementation
│   │   │   ├── models/          # SQLAlchemy models
│   │   │   │   ├── User.py
│   │   │   │   ├── Conversation.py
│   │   │   │   ├── Message.py
│   │   │   │   └── MemoryMetadata.py
│   │   │   ├── repositories/    # Data access objects
│   │   │   │   ├── UserRepository.py
│   │   │   │   ├── ConversationRepository.py
│   │   │   │   └── MemoryRepository.py
│   │   │   └── SQLiteClient.py  # Connection manager
│   │   │
│   │   ├── vector/              # ChromaDB/FAISS implementation
│   │   │   ├── ChromaDBClient.py
│   │   │   ├── FAISSClient.py
│   │   │   └── EmbeddingService.py
│   │   │
│   │   └── graph/               # Kuzu implementation
│   │       ├── KuzuClient.py
│   │       ├── GraphSchema.py
│   │       └── RelationshipMapper.py
│   │
│   ├── core/                    # Cross-cutting concerns
│   │   ├── config.py            # Configuration management
│   │   ├── security.py          # JWT, password hashing
│   │   ├── llm_client.py        # LLM abstraction (local/cloud)
│   │   ├── exceptions.py        # Custom exceptions
│   │   └── logging.py           # Structured logging
│   │
│   ├── schemas/                 # Pydantic models (validation)
│   │   ├── requests/            # Request schemas
│   │   │   ├── ChatRequest.py
│   │   │   ├── MemoryRequest.py
│   │   │   └── UserRequest.py
│   │   └── responses/           # Response schemas
│   │       ├── ChatResponse.py
│   │       ├── MemoryResponse.py
│   │       └── ErrorResponse.py
│   │
│   └── utils/                   # Utility functions
│       ├── formatters.py
│       ├── validators.py
│       └── helpers.py
│
├── tests/                       # Test suite
│   ├── unit/                    # Unit tests
│   │   ├── test_extractor.py
│   │   ├── test_classifier.py
│   │   └── test_scorer.py
│   ├── integration/             # Integration tests
│   │   ├── test_api.py
│   │   └── test_db.py
│   └── fixtures/                # Test data
│       ├── sample_messages.json
│       └── mock_responses.json
│
├── requirements.txt             # Python dependencies
├── pytest.ini                   # Pytest configuration
├── main.py                      # FastAPI entry point
└── .env.example                 # Environment variables template
```

---

## Microservices Structure (Future Scaling)

```text
services/
├── memory-engine/               # Core memory processing service
│   ├── src/
│   │   ├── extractors/
│   │   ├── classifiers/
│   │   └── scorers/
│   ├── Dockerfile
│   └── requirements.txt
│
├── vector-store/                # Vector database service
│   ├── src/
│   │   ├── embeddings/
│   │   └── search/
│   ├── Dockerfile
│   └── requirements.txt
│
├── graph-store/                 # Knowledge graph service
│   ├── src/
│   │   ├── relationships/
│   │   └── traversal/
│   ├── Dockerfile
│   └── requirements.txt
│
└── auth-service/                # Authentication service
    ├── src/
    │   ├── jwt/
    │   └── password/
    ├── Dockerfile
    └── requirements.txt
```

---

## Shared Contracts

```text
shared/
├── types/                       # Shared type definitions
│   ├── typescript/              # Frontend types
│   │   ├── chat.ts
│   │   ├── memory.ts
│   │   └── user.ts
│   └── python/                  # Backend schemas
│       ├── chat.py
│       ├── memory.py
│       └── user.py
│
├── api-contracts/               # OpenAPI/Swagger specs
│   ├── chat.yaml
│   ├── memory.yaml
│   └── user.yaml
│
└── constants/                   # Shared constants
    ├── memory_types.py
    ├── memory_statuses.py
    └── scoring_weights.py
```

---

## Infrastructure

```text
infrastructure/
├── docker/                      # Docker configurations
│   ├── Dockerfile.frontend      # Frontend container
│   ├── Dockerfile.backend       # Backend container
│   └── Dockerfile.services      # Microservices base
│
├── kubernetes/                  # K8s manifests (future)
│   ├── deployments/
│   ├── services/
│   └── ingress/
│
├── ci/                          # CI/CD pipelines
│   ├── .github/
│   │   └── workflows/
│   │       ├── test.yml
│   │       ├── build.yml
│   │       └── deploy.yml
│   └── scripts/
│       ├── build.sh
│       └── deploy.sh
│
└── terraform/                   # Infrastructure as Code (future)
    └── main.tf
```

---

## Key Design Patterns Applied

### 1. Repository Pattern (Data Access)
```python
# Example: MemoryRepository
class MemoryRepository(IMemoryRepository):
    def __init__(self, db: IRelationalDB):
        self._db = db

    async def save(self, memory: Memory) -> str:
        return await self._db.insert(memory)

    async def find_by_id(self, id: str) -> Optional[Memory]:
        return await self._db.query(id)
```

### 2. Strategy Pattern (LLM Clients)
```python
# Example: LLM Strategy
class ILLMClient(ABC):
    @abstractmethod
    async def generate(self, prompt: str) -> str: pass

class LocalLLMClient(ILLMClient):
    async def generate(self, prompt: str) -> str:
        return await ollama.generate(prompt)

class CloudLLMClient(ILLMClient):
    async def generate(self, prompt: str) -> str:
        return await mistral.generate(prompt)
```

### 3. Factory Pattern (Database Selection)
```python
# Example: Database Factory
class DatabaseFactory:
    @staticmethod
    def create(db_type: str) -> IDatabase:
        if db_type == "sqlite":
            return SQLiteClient()
        elif db_type == "chromadb":
            return ChromaDBClient()
        elif db_type == "kuzu":
            return KuzuClient()
```

### 4. Pipeline Pattern (Memory Processing)
```python
# Example: Memory Pipeline
class MemoryPipeline:
    def __init__(self, steps: List[PipelineStep]):
        self._steps = steps

    async def process(self, message: Message) -> Memory:
        context = {"message": message}
        for step in self._steps:
            context = await step.execute(context)
        return context["memory"]
```

---

## Dependency Flow (DIP Applied)

```text
┌─────────────────────────────────────────────────────┐
│                    API Layer                         │
│              (Routes + Controllers)                  │
└─────────────────────┬───────────────────────────────┘
                      │ depends on
                      ▼
┌─────────────────────────────────────────────────────┐
│               Business Logic Layer                   │
│            (Engine: Extract, Classify, Score)        │
└─────────────────────┬───────────────────────────────┘
                      │ depends on
                      ▼
┌─────────────────────────────────────────────────────┐
│              Data Access Layer (Interfaces)          │
│         (IRelationalDB, IVectorDB, IGraphDB)        │
└─────────────────────┬───────────────────────────────┘
                      │ implements
                      ▼
┌─────────────────────────────────────────────────────┐
│              Database Implementations                │
│        (SQLite, ChromaDB, Kuzu, FAISS)              │
└─────────────────────────────────────────────────────┘
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Python files | PascalCase | `MemoryExtractor.py` |
| TypeScript files | camelCase | `useChat.ts` |
| Test files | `test_` prefix | `test_extractor.py` |
| Config files | lowercase | `config.py`, `tsconfig.json` |
| Environment | `.env.example` | `.env.example` |

---

## Directory Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Python packages | lowercase | `engine/`, `db/` |
| TypeScript dirs | camelCase | `components/`, `store/` |
| Config dirs | lowercase | `config/`, `tests/` |
| Shared types | plural | `schemas/`, `interfaces/` |

---

## Implementation Phases (Updated)

| Phase | Description | Focus |
|-------|-------------|-------|
| Phase 1 | Foundation & Setup | Monorepo init, frontend/backend scaffold |
| Phase 2 | Core Memory Engine | Interfaces, Extractor, Classifier, Scorer |
| Phase 3 | Vector & Graph Integration | ChromaDB, Kuzu, Embeddings |
| Phase 4 | Context Building & UI | Pipeline orchestration, Dashboard |
| Phase 5 | Testing & Optimization | Unit tests, Integration tests, Docker |
| Phase 6 | Microservices Extraction | Extract services for scaling |

---

## Quick Start Commands

```bash
# Initialize monorepo
make init

# Start development
make dev

# Run tests
make test

# Build for production
make build

# Deploy with Docker
docker-compose up -d
```
