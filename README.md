# Memorai

**An AI Companion That Actually Remembers You**

Memorai is a specialized AI assistant with persistent, structured memory. It learns important information about a user, connects related concepts, remembers previous decisions and preferences, and uses that knowledge to provide personalized responses across conversations. It builds an evolving understanding of its user rather than just acting as a stateless chatbot.

## 🧠 Core Philosophy
The Large Language Model (LLM) is merely the generation engine. **The real product is the memory architecture surrounding it.**
- **Talk** -> **Extract** -> **Classify** -> **Store** -> **Connect** -> **Retrieve** -> **Rank** -> **Personalize** -> **Update** -> **Evolve**

## 🏗️ Architecture
Memorai operates on a dual-retrieval memory system:
1. **Semantic Memory (Vector DB)**: Fuzzy matching for preferences, plans, and facts.
2. **Relational Memory (Knowledge Graph)**: Explicit relationships between extracted entities.

When a user asks a question, Memorai merges relevant semantic memories and graph connections, ranks them by importance and confidence, and builds a robust context prompt for the LLM.

## 📚 Documentation
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

## 📂 Repository Structure
```text
memor-ai/
├── frontend/             # Next.js React UI (Chat & Memory Dashboard)
├── backend/              # FastAPI Python server
│   ├── app/
│   │   ├── api/          # REST endpoints (/chat, /memory)
│   │   ├── engine/       # Memory Extractor, Classifier, Scorer
│   │   ├── db/           # SQLite, VectorDB, and Kuzu connections
│   │   └── core/         # Configs, auth, LLM interfaces
├── docs/                 # System architecture and design documentation
└── README.md
```

## 🚀 Getting Started
*(Implementation instructions will be added here once Phase 1 is complete.)*
