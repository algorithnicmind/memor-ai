"""
Configuration management using msgspec and dotenv.
"""

import os
from typing import Any, Optional

import msgspec
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def _get_env(key: str, default: Optional[str] = None) -> Optional[str]:
    """Get environment variable with fallback."""
    return os.getenv(key, default)


def _get_env_required(key: str, default: str) -> str:
    """Get environment variable as a guaranteed string."""
    value = os.getenv(key)
    return value if value is not None else default


class EmbedderConfig(msgspec.Struct, kw_only=True):
    """Embedder configuration."""

    api_key: Optional[str] = msgspec.field(
        default_factory=lambda: _get_env("GOOGLE_API_KEY")
    )
    model: str = "gemini-embedding-001"
    embedding_dims: int = 768


class LLMConfig(msgspec.Struct, kw_only=True):
    """LLM configuration."""

    api_key: Optional[str] = msgspec.field(
        default_factory=lambda: _get_env("MISTRAL_API_KEY")
    )
    model: str = "mistral-large-latest"
    temperature: float = 0.1
    max_tokens: int = 4000
    top_p: float = 0.95


class VectorStoreConfig(msgspec.Struct, kw_only=True):
    """Vector store configuration."""

    db_path: str = "memory_vectors.db"
    collection_name: str = "memories"


class GraphStoreConfig(msgspec.Struct, kw_only=True):
    """Graph store configuration."""

    db_path: str = "memory_graph"
    enabled: bool = True
    threshold: float = 0.7


class HistoryConfig(msgspec.Struct, kw_only=True):
    """History database configuration."""

    db_path: str = "memory_history.db"


class MemoryConfig(msgspec.Struct, kw_only=True):
    """Main memory configuration."""

    embedder: EmbedderConfig = msgspec.field(default_factory=EmbedderConfig)
    llm: LLMConfig = msgspec.field(default_factory=LLMConfig)
    vector_store: VectorStoreConfig = msgspec.field(default_factory=VectorStoreConfig)
    graph_store: GraphStoreConfig = msgspec.field(default_factory=GraphStoreConfig)
    history: HistoryConfig = msgspec.field(default_factory=HistoryConfig)
    custom_fact_extraction_prompt: Optional[str] = None
    custom_update_memory_prompt: Optional[str] = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "MemoryConfig":
        """Create config from dictionary."""
        embedder_data = data.get("embedder", {})
        llm_data = data.get("llm", {})
        vector_store_data = data.get("vector_store", {})
        graph_store_data = data.get("graph_store", {})
        history_data = data.get("history", {})

        # Fill in API keys from env if not provided
        if "api_key" not in embedder_data or embedder_data["api_key"] is None:
            embedder_data["api_key"] = _get_env("GOOGLE_API_KEY")
        if "api_key" not in llm_data or llm_data["api_key"] is None:
            llm_data["api_key"] = _get_env("MISTRAL_API_KEY")

        embedder = EmbedderConfig(**embedder_data)
        llm = LLMConfig(**llm_data)
        vector_store = VectorStoreConfig(**vector_store_data)
        graph_store = GraphStoreConfig(**graph_store_data)
        history = HistoryConfig(**history_data)

        return cls(
            embedder=embedder,
            llm=llm,
            vector_store=vector_store,
            graph_store=graph_store,
            history=history,
            custom_fact_extraction_prompt=data.get("custom_fact_extraction_prompt"),
            custom_update_memory_prompt=data.get("custom_update_memory_prompt"),
        )


def get_config_from_env() -> MemoryConfig:
    """Create a MemoryConfig from environment variables."""
    return MemoryConfig(
        embedder=EmbedderConfig(
            api_key=_get_env("GOOGLE_API_KEY"),
            model=_get_env_required("EMBEDDING_MODEL", "gemini-embedding-001"),
            embedding_dims=int(_get_env_required("EMBEDDING_DIMS", "768")),
        ),
        llm=LLMConfig(
            api_key=_get_env("MISTRAL_API_KEY"),
            model=_get_env_required("LLM_MODEL", "mistral-large-latest"),
            temperature=float(_get_env_required("LLM_TEMPERATURE", "0.1")),
            max_tokens=int(_get_env_required("LLM_MAX_TOKENS", "4000")),
        ),
        vector_store=VectorStoreConfig(
            db_path=_get_env_required("VECTOR_DB_PATH", "memory_vectors.db"),
            collection_name=_get_env_required("VECTOR_COLLECTION", "memories"),
        ),
        graph_store=GraphStoreConfig(
            db_path=_get_env_required("GRAPH_DB_PATH", "memory_graph"),
            enabled=_get_env_required("GRAPH_ENABLED", "true").lower() == "true",
            threshold=float(_get_env_required("GRAPH_THRESHOLD", "0.7")),
        ),
        history=HistoryConfig(
            db_path=_get_env_required("HISTORY_DB_PATH", "memory_history.db"),
        ),
    )
