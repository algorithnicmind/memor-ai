# Project Structure (Microservices & Clean Code)

This document outlines the strictly decoupled, SOLID-compliant directory structure.

## Root Directory

```text
Memorai/
├── frontend/                      # Next.js Frontend
│   └── ... (Standard Next.js App Router structure)
│
├── backend/                       # Python FastAPI (Modular Monolith / Microservices)
│   ├── app/
│   │   ├── main.py                # FastAPI application entry point
│   │   ├── core/                  # App configuration and security
│   │   │
│   │   ├── api/                   # Presentation Layer (API Gateways/Routes)
│   │   │   ├── auth_routes.py
│   │   │   ├── chat_routes.py
│   │   │   └── memory_routes.py
│   │   │
│   │   ├── domains/               # Business Logic Layer (Isolated Micro-domains)
│   │   │   ├── auth/              # Auth Service Domain
│   │   │   │   ├── service.py
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── chat/              # Chat Inference Service Domain
│   │   │   │   ├── service.py     # Orchestrates LLM and Memory
│   │   │   │   ├── mistral.py     # Mistral API Client
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   └── memory/            # Memory Engine Service Domain
│   │   │       ├── service.py     # The Core Memory Brain
│   │   │       ├── extractor.py   # LLM Fact Extraction logic
│   │   │       └── schemas.py
│   │   │
│   │   └── infrastructure/        # Data Access Layer (Repositories)
│   │       ├── database/
│   │       │   ├── sqlite_repo.py # SQLite history/vector operations
│   │       │   └── kuzu_repo.py   # Kuzu Graph operations
│   │       └── embeddings/
│   │           └── gemini.py      # Gemini Embeddings Client
│   │
│   ├── tests/                     # Unit and Integration Tests
│   └── requirements.txt
│
└── docs/                          # Documentation
```
