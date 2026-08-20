"""Configuration management using msgspec and dotenv.

All env-driven config structs live here. One factory function,
`get_config_from_env()`, is the public entry point.

Path resolution: relative paths in `VECTOR_DB_PATH` / `GRAPH_DB_PATH`
are anchored to the `backend/` folder (not cwd) so the layout is
predictable regardless of where the server is launched from.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

import msgspec
from dotenv import load_dotenv

load_dotenv()

# app/core/config.py → backend/ (three parents up)
_BACKEND_DIR = Path(__file__).resolve().parents[2]


def _env_str(key: str, default: str) -> str:
    """Read env var or fall back to default."""
    value = os.getenv(key)
    return value if value is not None else default


def _env_optional(key: str) -> Optional[str]:
    """Read env var, returning None if unset."""
    return os.getenv(key)


def _env_float(key: str, default: float) -> float:
    """Read env var as float, fall back to default."""
    value = os.getenv(key)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _resolve_backend_path(env_key: str, default: str, *, ensure_parent: bool = False) -> str:
    """Read a path env var, resolving relative paths against the backend folder.

    `ensure_parent=True` creates the parent directory if it doesn't exist —
    useful for store paths (Kuzu expects its target dir to exist before
    opening the database file inside it).
    """
    raw = _env_str(env_key, default)
    path = Path(raw)
    if not path.is_absolute():
        path = _BACKEND_DIR / path
    if ensure_parent:
        path.parent.mkdir(parents=True, exist_ok=True)
    return path.as_posix()


class ProviderConfig(msgspec.Struct, kw_only=True):
    """OpenAI-SDK-compatible provider config — chat + embeddings share these."""

    api_key: Optional[str] = msgspec.field(
        default_factory=lambda: _env_optional("OPENAI_COMPAT_API_KEY")
    )
    base_url: str = msgspec.field(
        default_factory=lambda: _env_str(
            "OPENAI_COMPAT_BASE_URL", "https://api.mistral.ai/v1"
        )
    )
    chat_model: str = msgspec.field(
        default_factory=lambda: _env_str(
            "OPENAI_COMPAT_CHAT_MODEL", "mistral-large-latest"
        )
    )
    embed_model: str = msgspec.field(
        default_factory=lambda: _env_str(
            "OPENAI_COMPAT_EMBED_MODEL", "mistral-embed"
        )
    )
    embedding_dims: int = msgspec.field(
        default_factory=lambda: int(_env_str("EMBEDDING_DIMS", "1024"))
    )
    temperature: float = msgspec.field(
        default_factory=lambda: float(_env_str("LLM_TEMPERATURE", "0.1"))
    )
    max_tokens: int = msgspec.field(
        default_factory=lambda: int(_env_str("LLM_MAX_TOKENS", "4000"))
    )


class VectorStoreConfig(msgspec.Struct, kw_only=True):
    """Vector store configuration."""

    db_path: str = msgspec.field(
        default_factory=lambda: _resolve_backend_path(
            "VECTOR_DB_PATH", "data/vectors.db"
        )
    )
    collection_name: str = msgspec.field(
        default_factory=lambda: _env_str("VECTOR_COLLECTION", "memories")
    )


class GraphStoreConfig(msgspec.Struct, kw_only=True):
    """Graph store configuration."""

    db_path: str = msgspec.field(
        default_factory=lambda: _resolve_backend_path(
            "GRAPH_DB_PATH", "data/graph", ensure_parent=True
        )
    )
    enabled: bool = msgspec.field(
        default_factory=lambda: _env_str("GRAPH_ENABLED", "true").lower() == "true"
    )
    threshold: float = msgspec.field(
        default_factory=lambda: float(_env_str("GRAPH_THRESHOLD", "0.7"))
    )


class HistoryConfig(msgspec.Struct, kw_only=True):
    """History database configuration (Tortoise-managed)."""

    # Tortoise owns the SQLite URL; this just names it.
    db_url: str = msgspec.field(
        default_factory=lambda: _env_str("DATABASE_URL", "sqlite://data/memorai.db")
    )


class AuthConfig(msgspec.Struct, kw_only=True):
    """Auth configuration — JWT secret + bcrypt cost."""

    jwt_secret: Optional[str] = msgspec.field(
        default_factory=lambda: _env_optional("JWT_SECRET")
    )
    jwt_ttl_minutes: int = msgspec.field(
        default_factory=lambda: int(_env_str("JWT_TTL_MINUTES", "30"))
    )
    bcrypt_rounds: int = msgspec.field(
        default_factory=lambda: int(_env_str("BCRYPT_ROUNDS", "12"))
    )


class LLMConfig(msgspec.Struct, kw_only=True):
    """LLM client config — separate budget per client.

    Chat and embeddings each get their own bucket (see
    `app.core.rate_limit.build_llm_rate_limiter`). Two env vars
    let providers throttle one client harder than the other.
    """

    chat_rate_limit_rps: float = msgspec.field(
        default_factory=lambda: _env_float("LLM_CHAT_RATE_LIMIT_RPS", 1.5)
    )
    embed_rate_limit_rps: float = msgspec.field(
        default_factory=lambda: _env_float("LLM_EMBED_RATE_LIMIT_RPS", 1.5)
    )


class AppConfig(msgspec.Struct, kw_only=True):
    """Top-level app config — bundle of all sub-configs."""

    provider: ProviderConfig
    vector_store: VectorStoreConfig = msgspec.field(default_factory=VectorStoreConfig)
    graph_store: GraphStoreConfig = msgspec.field(default_factory=GraphStoreConfig)
    history: HistoryConfig = msgspec.field(default_factory=HistoryConfig)
    auth: AuthConfig = msgspec.field(default_factory=AuthConfig)
    llm: LLMConfig = msgspec.field(default_factory=LLMConfig)


def get_config_from_env() -> AppConfig:
    """Build a fully-populated AppConfig from environment variables."""
    return AppConfig(provider=ProviderConfig())
