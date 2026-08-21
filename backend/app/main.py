"""FastAPI app — lifespan, CORS, routers, custom msgspec JSON encoder.

Lifespan opens Tortoise (so all models are registered), constructs one
Memory singleton on `app.state.memory`, and starts the background
memory-ingest drainer that picks up chat messages which survived a
crash / restart. Shutdown cancels the drainer and closes everything.

Routes:
  /health                              — public
  /auth/register, /auth/login          — public
  /auth/me, /auth/logout               — protected (current_user)
  /api/chat, /api/chat/search          — protected
  /api/memories, /api/memories/{id}    — protected
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise import Tortoise

from app.api.auth_routes import router as auth_router
from app.api.chat_routes import router as chat_router
from app.api.memory_routes import router as memory_router
from app.api.msgspec_response import MsgspecJSONResponse, to_jsonable
from app.api.schemas import HealthResponse
from app.core.config import get_config_from_env
from app.core.logging_utils import setup_logging
from app.domains.ingest import drain_loop
from app.domains.memory.service import Memory
from app.infrastructure.database.tortoise_config import TORTOISE_ORM


async def _ensure_schema_columns() -> None:
    """ALTER TABLE for columns that `generate_schemas` won't add on existing DBs.

    We don't run aerich; Tortoise's `generate_schemas()` only creates
    *missing* tables, it doesn't ALTER existing ones. So new columns
    (e.g. `is_ingested`, `ingest_attempts`) need raw SQL when the
    table is already there from a prior version.

    Idempotent — each ALTER skips if the column already exists.
    """
    conn = Tortoise.get_connection("default")
    rows = await conn.execute_query_dict("PRAGMA table_info(chat_messages)")
    columns = {row["name"] for row in rows}
    if "is_ingested" not in columns:
        await conn.execute_script(
            "ALTER TABLE chat_messages "
            "ADD COLUMN is_ingested BOOLEAN NOT NULL DEFAULT 1"
        )
    if "ingest_attempts" not in columns:
        await conn.execute_script(
            "ALTER TABLE chat_messages "
            "ADD COLUMN ingest_attempts INT NOT NULL DEFAULT 0"
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Open Tortoise + build the Memory singleton + start drainer, then tear down."""
    setup_logging()
    config = get_config_from_env()
    app.state.config = config
    # _enable_global_fallback=True: ASGI lifespan runs in a separate task
    # from request handlers; without global fallback the request context
    # can't see the connections initialised here.
    await Tortoise.init(config=TORTOISE_ORM, _enable_global_fallback=True)
    # Auto-create tables on first run. Safe to call on every startup —
    # no-ops once the schema matches the models.
    await Tortoise.generate_schemas()
    # Then add columns that `generate_schemas` can't ALTER on existing
    # tables. Cheap on already-up-to-date DBs (PRAGMA check + skip).
    await _ensure_schema_columns()
    app.state.memory = Memory(config)
    # Background drainer: picks up any chat messages whose typed-memory
    # ingest didn't run (server crash mid-call, restart, etc). The
    # fire-and-forget path in chat_routes handles the happy path;
    # this loop is the safety net for the unhappy ones.
    app.state.drain_task = asyncio.create_task(drain_loop(app.state.memory))
    try:
        yield
    finally:
        app.state.drain_task.cancel()
        with suppress(asyncio.CancelledError):
            await app.state.drain_task
        await app.state.memory.close()
        await Tortoise.close_connections()


app = FastAPI(
    title="Memorai API",
    version="1.0.0",
    lifespan=lifespan,
    default_response_class=MsgspecJSONResponse,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(memory_router)


@app.get("/health", tags=["health"], response_model=None)
async def health_check() -> HealthResponse:
    return to_jsonable(HealthResponse(status="healthy", service="Memorai API"))


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.getenv("PORT", "8005"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)