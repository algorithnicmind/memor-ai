"""HTTP DTOs — msgspec structs only.

Kept loose on inner shapes (dict[str, Any]) where the underlying
memory record is itself a JSON blob; tight on the request envelope.
"""

from __future__ import annotations

from typing import Any

import msgspec


class ChatRequest(msgspec.Struct, kw_only=True):
    message: str
    metadata: dict[str, Any] | None = None
    conversation_id: str | None = None
    model: str | None = None
    provider: str | None = None  # "cloud" | "local" | "ollama"


class ModelOption(msgspec.Struct, kw_only=True):
    id: str
    name: str
    provider: str  # "cloud" | "local"
    description: str
    is_local: bool
    is_available: bool


class ModelsListResponse(msgspec.Struct, kw_only=True):
    active_model: str
    active_provider: str
    models: list[ModelOption]
    ollama_running: bool


class ChatResponse(msgspec.Struct, kw_only=True):
    response: str
    stored: list[dict[str, Any]] = msgspec.field(default_factory=list)
    relations: list[dict[str, Any]] = msgspec.field(default_factory=list)
    conversation_id: str


class SearchRequest(msgspec.Struct, kw_only=True):
    query: str
    limit: int = 10
    threshold: float = 0.5


class SearchResponse(msgspec.Struct, kw_only=True):
    results: list[dict[str, Any]]
    relations: list[dict[str, Any]] = msgspec.field(default_factory=list)


class MemoryListResponse(msgspec.Struct, kw_only=True):
    results: list[dict[str, Any]]


class HistoryResponse(msgspec.Struct, kw_only=True):
    history: list[dict[str, Any]]


class MessageResponse(msgspec.Struct, kw_only=True):
    message: str


class HealthResponse(msgspec.Struct, kw_only=True):
    status: str
    service: str


# ---- Chat history -------------------------------------------------------


class ConversationSummary(msgspec.Struct, kw_only=True):
    """One row in the sidebar conversation list."""

    id: str
    title: str
    created_at: str
    last_message_at: str


class ConversationsListResponse(msgspec.Struct, kw_only=True):
    conversations: list[ConversationSummary] = msgspec.field(default_factory=list)


class ChatMessageDTO(msgspec.Struct, kw_only=True):
    id: str
    role: str
    content: str
    created_at: str


class ConversationMessagesResponse(msgspec.Struct, kw_only=True):
    conversation_id: str
    title: str
    messages: list[ChatMessageDTO] = msgspec.field(default_factory=list)