# Architecture Overview

## 1. Design Principles

This architecture follows **SOLID principles** and **Clean Code conventions** by Robert C. Martin (Uncle Bob):

| Principle | Application |
|-----------|-------------|
| **Single Responsibility** | Each component has one reason to change |
| **Open/Closed** | Interfaces allow extension without modification |
| **Liskov Substitution** | Database implementations are interchangeable |
| **Interface Segregation** | Small, focused interfaces |
| **Dependency Inversion** | High-level modules depend on abstractions |

**Example - Single Responsibility:**
```python
# BAD: Class does too many things
class MemoryProcessor:
    def extract_facts(self, message): ...
    def classify_memory(self, memory): ...
    def score_memory(self, memory): ...
    def store_memory(self, memory): ...

# GOOD: Each class has one responsibility
class FactExtractor:
    def extract(self, message): ...

class MemoryClassifier:
    def classify(self, memory): ...

class ImportanceScorer:
    def score(self, memory): ...

class MemoryRepository:
    def store(self, memory): ...
```

**Example - Open/Closed:**
```python
# Interface - Open for extension
class IExtractor(ABC):
    @abstractmethod
    async def extract(self, message: str) -> Dict: pass

# Closed for modification - existing code doesn't change
class FactExtractor(IExtractor):
    async def extract(self, message: str) -> Dict:
        pass

# Adding new extractor doesn't modify existing code
class SentimentExtractor(IExtractor):
    async def extract(self, message: str) -> Dict:
        pass
```

## 2. High-Level Architecture

The architecture consists of 7 major components designed to intercept user messages, extract knowledge, and augment the LLM prompt.

```mermaid
graph TD
    User([User]) -->|HTTP| Frontend[Next.js Chat UI]
    Frontend -->|POST /chat| Backend[FastAPI Backend]
    
    Backend --> Extraction[Memory Extraction Engine]
    
    Extraction -->|Update/Insert| VecDB[(Vector DB)]
    Extraction -->|Nodes/Edges| GraphDB[(Kuzu Graph DB)]
    Extraction -->|Metadata| SQLite[(SQLite)]
    
    Backend --> Retrieval[Memory Retrieval + Context Builder]
    Retrieval -.->|Semantic Search| VecDB
    Retrieval -.->|Graph Traversal| GraphDB
    
    Retrieval -->|Ranked Context| Context[Context Builder]
    Context --> LLM[Local/Cloud LLM]
    LLM -->|Personalized Response| Backend
    Backend --> Frontend
```

## 3. Component Descriptions

1. **Frontend**: React-based UI featuring the chat interface and the Memory Dashboard.
2. **Backend API**: The central coordinator handling auth, routing, and business logic.
3. **LLM**: Generation engine (Mistral/Gemini/Local Llama). Has no native memory.
4. **Memory Extraction Engine**: Analyzes incoming messages to extract facts, decisions, goals, etc. Calculates importance and handles duplication/conflict.
5. **Vector Memory**: Stores dense embeddings of memories for fuzzy semantic retrieval.
6. **Knowledge Graph**: Stores explicit entities and relationships for logical graph traversal.
7. **Retrieval & Context Builder**: Merges results from Vector and Graph DBs, applies the ranking algorithm, and constructs the final prompt for the LLM.

## 4. Architecture Patterns

| Pattern | Application |
|---------|-------------|
| **Repository Pattern** | Data access abstraction |
| **Strategy Pattern** | LLM client selection |
| **Factory Pattern** | Database instantiation |
| **Pipeline Pattern** | Memory processing flow |
| **Dependency Injection** | Component wiring |

### Memory Pipeline Flow

```mermaid
graph LR
    Msg[User Message] --> Ext[Fact Extractor]
    Msg --> Ent[Entity Extractor]
    Ext --> Cls[Memory Classifier]
    Ent --> Cls
    Cls --> Imp[Importance Scorer]
    Imp --> Conf[Confidence Scorer]
    Conf --> Rec[Recency Scorer]
    Rec --> Rel[(Relational DB)]
    Rec --> Vec[(Vector DB)]
    Rec --> Graph[(Graph DB)]
    Rel --> Sem[Semantic Retriever]
    Vec --> Sem
    Graph --> RelRet[Relational Retriever]
    Sem --> Rank[Memory Ranker]
    RelRet --> Rank
    Rank --> Ctx[Context Builder]
    Ctx --> Prompt[LLM Prompt]
    Prompt --> Resp[AI Response]
```

## 5. Dependency Flow (DIP Applied)

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

## 6. Frontend Architecture

```text
frontend/src/
├── app/           # Pages (chat, dashboard)
├── components/    # UI Components (chat, memory, ui)
├── hooks/         # Custom React hooks
├── lib/           # API clients
├── store/         # Zustand state management
└── types/         # TypeScript type definitions
```

**Data Flow:**
```
Pages → Components → Hooks → Store/API → Types/Utils
```

## 7. Backend Architecture

```text
backend/app/
├── api/           # Routes + Controllers
├── engine/        # Business Logic (Extractor, Classifier, Scorer)
├── db/            # Data Access (SQLite, ChromaDB, Kuzu)
├── core/          # Config, Security, LLM Client
├── schemas/       # Pydantic models
└── utils/         # Utility functions
```

**Layer Flow:**
```
API → Engine → DB → Core
```
