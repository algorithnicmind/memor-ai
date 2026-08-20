"""FastAPI app — lifespan, CORS, routers, custom msgspec JSON encoder.

Lifespan opens Tortoise (so all models are registered) and constructs
one Memory singleton on `app.state.memory`. Shutdown closes both.

Routes:
  /health                              — public
  /auth/register, /auth/login          — public
  /auth/me, /auth/logout               — protected (current_user)
  /api/chat, /api/chat/search          — protected
  /api/memories, /api/memories/{id}    — protected
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise import Tortoise

from app.api.auth_routes import router as auth_router
from app.api.chat_routes import router as chat_router
from app.api.memory_routes import router as memory_router
from app.api.msgspec_response import MsgspecJSONResponse
from app.api.schemas import HealthResponse
from app.core.config import get_config_from_env
from app.core.logging_utils import setup_logging
from app.domains.memory.service import Memory
from app.infrastructure.database.tortoise_config import TORTOISE_ORM


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Open Tortoise + build the Memory singleton, then tear down on shutdown."""
    setup_logging()
    config = get_config_from_env()
    app.state.config = config
    await Tortoise.init(config=TORTOISE_ORM)
    # Auto-create tables on first run. Safe to call on every startup —
    # no-ops once the schema matches the models.
    await Tortoise.generate_schemas()
    app.state.memory = Memory(config)
    try:
        yield
    finally:
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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(memory_router)


@app.get("/health", tags=["health"])
async def health_check() -> HealthResponse:
    return HealthResponse(status="healthy", service="Memorai API")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)