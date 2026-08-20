# Project Structure (Microservices & Clean Code)

This document outlines the strictly decoupled, SOLID-compliant directory
structure. The backend is split into three domains (`auth`, `chat`,
`memory`) that share no code with each other — they communicate only
through the FastAPI router in `api/`.

## Root Directory

```text
Memorai/
├── frontend/                      # Next.js 16 + React 19 Frontend
│   └── ... (App Router structure)
│
├── backend/                       # Python FastAPI (Modular Monolith)
│   ├── app/
│   │   ├── main.py                # FastAPI app + lifespan (Tortoise init, Memory singleton)
│   │   │
│   │   ├── core/                  # Cross-cutting infra
│   │   │   ├── config.py          #   msgspec config structs (env-driven)
│   │   │   ├── logging_utils.py
│   │   │   └── rate_limit.py      #   AsyncRateLimiter token bucket
│   │   │
│   │   ├── api/                   # Presentation Layer
│   │   │   ├── auth_routes.py     #   /auth/register, /auth/login, /auth/me, /auth/logout
│   │   │   ├── chat_routes.py     #   /api/chat, /health
│   │   │   ├── memory_routes.py   #   /api/memories/* CRUD
│   │   │   ├── deps.py            #   current_user + msgspec_body() decoder
│   │   │   └── msgspec_response.py#   to_jsonable() Struct → JSON helper
│   │   │
│   │   ├── domains/               # Business Logic Layer (no cross-imports)
│   │   │   ├── auth/
│   │   │   │   ├── models.py      #   Tortoise User
│   │   │   │   ├── service.py     #   register / login / me
│   │   │   │   └── schemas.py     #   msgspec DTOs
│   │   │   ├── chat/
│   │   │   │   └── openai_compat.py#  OpenAI-SDK-compatible chat client + tool defs
│   │   │   └── memory/
│   │   │       ├── service.py     #   Memory orchestrator
│   │   │       ├── extraction_prompts.py  # typed-fact + relation prompts
│   │   │       └── schemas.py     #   msgspec DTOs
│   │   │
│   │   └── infrastructure/        # Data + provider adapters
│   │       ├── auth/
│   │       │   ├── password.py    #   bcrypt hash/verify (direct bcrypt>=4.2 API)
│   │       │   └── jwt.py         #   HS256 issue/decode
│   │       ├── database/
│   │       │   ├── models.py      #   Tortoise MemoryVector + MemoryHistory
│   │       │   ├── tortoise_config.py
│   │       │   ├── vector_repo.py #   cosine search on MemoryVector
│   │       │   ├── sqlite_repo.py #   history queries on MemoryHistory
│   │       │   └── graph_repo.py  #   Ladybug graph store (Cypher)
│   │       └── embeddings/
│   │           └── openai_compat.py  # OpenAI-SDK-compatible embedder
│   │
│   ├── migrations/                # aerich versioned migrations (Tortoise)
│   ├── scripts/
│   │   └── smoke_test.py          # register → login → me → chat → recall → delete
│   ├── tests/                     # (reserved)
│   ├── pyproject.toml             # uv source of truth
│   ├── uv.lock                    # committed
│   ├── .env.example
│   ├── LICENSE                    # MIT
│   └── README.md
│
└── docs/                          # Product / tech docs
    ├── 01_PRD.md
    ├── 02_TRD.md
    ├── 03_Architecture.md
    ├── 04_HLD.md
    ├── 05_LLD.md
    ├── 06_DFD.md
    ├── 07_Wireframes.md
    ├── 08_MASTER_TODO.md
    └── 09_Project_Structure.md
```

## Layer Flow

```
HTTP request
  → api/deps (JWT → current_user; msgspec_body decodes the DTO)
  → api/<domain>_routes
  → domains/<domain>/service
  → infrastructure/<database|auth|embeddings>
  → Tortoise / Ladybug / OpenAI-compatible provider

Response
  → msgspec.Struct  →  to_jsonable()  →  JSON body
```

## Why three domains, one process

Each domain folder is independently importable — a future move to
three services (Auth / Chat / Memory) touches only the FastAPI
`lifespan` wiring and the `app.state` injection. No domain code
changes.
