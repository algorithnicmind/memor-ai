# MASTER TODO

## Phase 1: Foundation & Setup

### Monorepo Setup
- [ ] Initialize monorepo structure with `frontend/`, `backend/`, `services/`, `shared/`, `infrastructure/`
- [ ] Create `docker-compose.yml` for local development
- [ ] Create `Makefile` with common commands (dev, test, build)
- [ ] Setup `.gitignore` for Python and Node.js
- [ ] Create `.env.example` with all required environment variables

### Backend Setup
- [ ] Initialize FastAPI project with Pydantic
- [ ] Create `backend/app/core/config.py` for configuration management
- [ ] Create `backend/app/core/exceptions.py` for custom exceptions
- [ ] Create `backend/app/core/logging.py` for structured logging
- [ ] Setup SQLite database with SQLAlchemy
- [ ] Create `backend/app/db/relational/models/` for database models
- [ ] Create `backend/app/db/interfaces/` for database abstractions (IRelationalDB)
- [ ] Implement JWT authentication in `backend/app/core/security.py`
- [ ] Create `backend/app/api/routes/health.py` for health check endpoint
- [ ] Create `backend/app/api/routes/user.py` for user endpoints

### Frontend Setup
- [ ] Initialize Next.js project with TypeScript and Tailwind CSS
- [ ] Create `frontend/src/types/` for TypeScript type definitions
- [ ] Create `frontend/src/lib/api/` for API client functions
- [ ] Create `frontend/src/store/` for Zustand state management
- [ ] Create `frontend/src/hooks/` for custom React hooks
- [ ] Create basic Chat UI components in `frontend/src/components/chat/`
- [ ] Implement JWT authentication flow in frontend

---

## Phase 2: Core Memory Engine

### Interfaces (SOLID: ISP)
- [ ] Create `backend/app/engine/interfaces/IExtractor.py`
- [ ] Create `backend/app/engine/interfaces/IClassifier.py`
- [ ] Create `backend/app/engine/interfaces/IScorer.py`
- [ ] Create `backend/app/engine/interfaces/IRetriever.py`
- [ ] Create `backend/app/engine/interfaces/IContextBuilder.py`

### Extractor Module (SOLID: SRP)
- [ ] Create `backend/app/engine/extractor/FactExtractor.py`
- [ ] Create `backend/app/engine/extractor/EntityExtractor.py`
- [ ] Create `backend/app/engine/extractor/extractor_prompts.py`
- [ ] Implement LLM-based fact extraction
- [ ] Implement entity extraction for knowledge graph

### Classifier Module (SOLID: SRP)
- [ ] Create `backend/app/engine/classifier/MemoryClassifier.py`
- [ ] Create `backend/app/engine/classifier/TypeDetector.py`
- [ ] Create `backend/app/engine/classifier/classifier_rules.py`
- [ ] Implement memory type classification (simple, preference, goal, plan, decision, experience, relationship, temporary)

### Scorer Module (SOLID: SRP)
- [ ] Create `backend/app/engine/scorer/ImportanceScorer.py`
- [ ] Create `backend/app/engine/scorer/ConfidenceScorer.py`
- [ ] Create `backend/app/engine/scorer/RecencyScorer.py`
- [ ] Implement importance scoring algorithm
- [ ] Implement confidence calculation

### Pipeline Orchestration (SOLID: OCP)
- [ ] Create `backend/app/engine/pipeline/PipelineStep.py`
- [ ] Create `backend/app/engine/pipeline/MemoryPipeline.py`
- [ ] Implement step-based pipeline for memory processing

---

## Phase 3: Vector & Graph Integration

### Database Interfaces (SOLID: DIP)
- [ ] Create `backend/app/db/interfaces/IRelationalDB.py`
- [ ] Create `backend/app/db/interfaces/IVectorDB.py`
- [ ] Create `backend/app/db/interfaces/IGraphDB.py`

### Relational Database (SOLID: LSP)
- [ ] Create `backend/app/db/relational/SQLiteClient.py`
- [ ] Create `backend/app/db/relational/repositories/UserRepository.py`
- [ ] Create `backend/app/db/relational/repositories/ConversationRepository.py`
- [ ] Create `backend/app/db/relational/repositories/MemoryRepository.py`
- [ ] Implement CRUD operations for all repositories

### Vector Database (SOLID: LSP)
- [ ] Create `backend/app/db/vector/ChromaDBClient.py`
- [ ] Create `backend/app/db/vector/FAISSClient.py`
- [ ] Create `backend/app/db/vector/EmbeddingService.py`
- [ ] Implement local embeddings with sentence-transformers
- [ ] Implement vector storage and semantic search

### Graph Database (SOLID: LSP)
- [ ] Create `backend/app/db/graph/KuzuClient.py`
- [ ] Create `backend/app/db/graph/GraphSchema.py`
- [ ] Create `backend/app/db/graph/RelationshipMapper.py`
- [ ] Implement entity-relationship storage
- [ ] Implement graph traversal for multi-hop reasoning

---

## Phase 4: Context Building & UI Polish

### Retriever Module (SOLID: SRP)
- [ ] Create `backend/app/engine/retriever/SemanticRetriever.py`
- [ ] Create `backend/app/engine/retriever/RelationalRetriever.py`
- [ ] Create `backend/app/engine/retriever/ContextBuilder.py`
- [ ] Create `backend/app/engine/retriever/MemoryRanker.py`
- [ ] Implement dual retrieval system (Vector + Graph)
- [ ] Implement memory ranking algorithm

### Context Building
- [ ] Implement context template formatting
- [ ] Implement "Why did you say that?" transparency feature
- [ ] Connect full pipeline: Message → Extract → Retrieve → Context → LLM → Response

### Frontend UI
- [ ] Build Memory Panel in Chat UI
- [ ] Build Memory Dashboard page
- [ ] Build Graph Visualizer component
- [ ] Build Memory Timeline component
- [ ] Implement memory view, edit, delete functionality

---

## Phase 5: Testing & Optimization

### Unit Tests
- [ ] Write tests for `FactExtractor`
- [ ] Write tests for `MemoryClassifier`
- [ ] Write tests for `ImportanceScorer`
- [ ] Write tests for `SemanticRetriever`
- [ ] Write tests for `RelationalRetriever`
- [ ] Write tests for `ContextBuilder`

### Integration Tests
- [ ] Write tests for API endpoints
- [ ] Write tests for database operations
- [ ] Write tests for full memory pipeline
- [ ] Write Test Case 1: Basic memory recall
- [ ] Write Test Case 2: Cross-session memory recall
- [ ] Write Test Case 3: Contradiction/Conflict resolution
- [ ] Write Test Case 4: Irrelevant memory filtering
- [ ] Write Test Case 5: Graph reasoning (multi-hop)

### Performance Optimization
- [ ] Measure latency and token efficiency
- [ ] Optimize LLM prompts
- [ ] Implement caching for frequently accessed memories
- [ ] Optimize database queries

### Documentation
- [ ] Update API documentation
- [ ] Create developer guide
- [ ] Create deployment guide
- [ ] Final documentation and deployment scripts

---

## Phase 6: Microservices Extraction (Future)

### Service Extraction
- [ ] Extract memory-engine service
- [ ] Extract vector-store service
- [ ] Extract graph-store service
- [ ] Extract auth-service

### Infrastructure
- [ ] Create Dockerfiles for each service
- [ ] Setup Kubernetes manifests
- [ ] Configure CI/CD pipelines
- [ ] Setup monitoring and logging

---

## Implementation Order

| Phase | Focus | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Foundation & Setup | 1-2 weeks |
| Phase 2 | Core Memory Engine | 2-3 weeks |
| Phase 3 | Vector & Graph Integration | 2-3 weeks |
| Phase 4 | Context Building & UI Polish | 2-3 weeks |
| Phase 5 | Testing & Optimization | 1-2 weeks |
| Phase 6 | Microservices Extraction | Future |

---

## Progress Tracking

| Phase | Status | Start Date | End Date |
|-------|--------|------------|----------|
| Phase 1 | Not Started | - | - |
| Phase 2 | Not Started | - | - |
| Phase 3 | Not Started | - | - |
| Phase 4 | Not Started | - | - |
| Phase 5 | Not Started | - | - |
| Phase 6 | Not Started | - | - |
