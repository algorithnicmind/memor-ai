# Project Structure

This document outlines the planned folder and file structure for the Memorai repository. This structure separates the frontend application, the backend API, and the memory engine components logically.

## Root Directory

```text
memor-ai/
├── frontend/               # Next.js Application (React + Tailwind)
├── backend/                # FastAPI Application (Python)
├── docs/                   # Architectural documentation
└── README.md               # Main project overview
```

## Frontend Structure (Next.js)

```text
frontend/
├── public/                 # Static assets (images, icons)
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── chat/           # Chat interface page
│   │   ├── dashboard/      # Memory dashboard page
│   │   └── layout.tsx      # Global layout wrapper
│   ├── components/         # Reusable React components
│   │   ├── chat/           # Message bubbles, input fields
│   │   ├── memory/         # Dashboard widgets, graph visualizer
│   │   └── ui/             # Generic UI (buttons, modals, alerts)
│   ├── lib/                # API clients, utilities
│   ├── hooks/              # Custom React hooks
│   └── store/              # State management (Context/Zustand)
├── tailwind.config.ts      # Tailwind configuration
└── package.json            # Node dependencies
```

## Backend Structure (FastAPI)

```text
backend/
├── app/
│   ├── api/                # API Route Definitions
│   │   ├── routes/         # /chat, /memories, /users endpoints
│   │   └── dependencies.py # FastAPI dependencies (e.g., get_db, auth)
│   │
│   ├── engine/             # The core Memory architecture
│   │   ├── extractor/      # LLM prompts for extracting facts/entities
│   │   ├── classifier/     # Logic to categorize memory types
│   │   ├── scorer/         # Importance and confidence calculation
│   │   └── retriever/      # Dual-retrieval logic and Context Builder
│   │
│   ├── db/                 # Database Interfaces
│   │   ├── relational/     # SQLAlchemy models for SQLite (Users, Metadata)
│   │   ├── vector/         # Client wrappers for ChromaDB/FAISS
│   │   └── graph/          # Client wrappers and schema for Kuzu
│   │
│   ├── core/               # App configuration and singletons
│   │   ├── config.py       # Environment variables
│   │   ├── security.py     # JWT, hashing
│   │   └── llm_client.py   # Interface to Local/Cloud LLMs
│   │
│   └── schemas/            # Pydantic models for validation
│       ├── requests.py     # API request body schemas
│       └── responses.py    # API response body schemas
│
├── tests/                  # Pytest cases (memory tests, conflicts)
├── requirements.txt        # Python dependencies
└── main.py                 # FastAPI application entry point
```
