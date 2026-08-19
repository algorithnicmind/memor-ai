"""
Data models using msgspec for efficient serialization.
"""

from typing import Any, Optional

import msgspec


class MemoryItem(msgspec.Struct, kw_only=True):
    """Represents a memory item."""

    id: str
    memory: str
    hash: Optional[str] = None
    score: Optional[float] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    run_id: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class VectorRecord(msgspec.Struct, kw_only=True):
    """Represents a vector record in storage."""

    id: str
    vector: list[float]
    payload: dict[str, Any]


class HistoryRecord(msgspec.Struct, kw_only=True):
    """Represents a history record."""

    id: str
    memory_id: str
    old_memory: Optional[str] = None
    new_memory: Optional[str] = None
    event: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    is_deleted: bool = False


class GraphEntity(msgspec.Struct, kw_only=True):
    """Represents a graph entity."""

    source: str
    relationship: str
    destination: str


class MemoryAction(msgspec.Struct, kw_only=True):
    """Represents a memory action from LLM response."""

    id: str
    text: str
    event: str  # ADD, UPDATE, DELETE, NONE
    old_memory: Optional[str] = None


class FactExtractionResponse(msgspec.Struct, kw_only=True):
    """Response from fact extraction."""

    facts: list[str]


class MemoryUpdateResponse(msgspec.Struct, kw_only=True):
    """Response from memory update."""

    memory: list[MemoryAction]


class ToolCall(msgspec.Struct, kw_only=True):
    """Represents a tool call from LLM."""

    name: str
    arguments: dict[str, Any]


class LLMResponse(msgspec.Struct, kw_only=True):
    """Represents an LLM response with optional tool calls."""

    content: Optional[str] = None
    tool_calls: Optional[list[ToolCall]] = None


class EntityExtraction(msgspec.Struct, kw_only=True):
    """Represents an extracted entity."""

    entity: str
    entity_type: str


class RelationExtraction(msgspec.Struct, kw_only=True):
    """Represents an extracted relation."""

    source: str
    relationship: str
    destination: str


class MemoryType(msgspec.Struct, kw_only=True):
    """Memory type enumeration."""

    SIMPLE: str = "simple"
    DECISION: str = "decision"
    PREFERENCE: str = "preference"
    PLAN: str = "plan"


class DecisionMemory(msgspec.Struct, kw_only=True):
    """
    Represents a structured decision memory.
    Captures the full context of a decision for better recall and reasoning.
    """

    decision_id: str
    timestamp: str
    goal: str
    constraints: list[str] = msgspec.field(default_factory=list)
    alternatives: list[str] = msgspec.field(default_factory=list)
    final_choice: Optional[str] = None
    reasoning: Optional[str] = None
    emotional_state: Optional[str] = None
    privacy_level: str = "private"  # "private", "shared", "public"
    category: Optional[str] = None  # e.g., "career", "health", "finance", "personal"
    outcome: Optional[str] = None  # Can be updated later with actual outcome
    confidence: Optional[float] = None  # 0.0 to 1.0


class StructuredFact(msgspec.Struct, kw_only=True):
    """
    Represents a structured fact with type classification.
    """

    content: str
    memory_type: str = "simple"  # simple, decision, preference, plan
    category: Optional[str] = None
    importance: str = "normal"  # low, normal, high, critical

    # Optional structured fields (populated for decisions)
    goal: Optional[str] = None
    constraints: Optional[list[str]] = None
    alternatives: Optional[list[str]] = None
    final_choice: Optional[str] = None
    reasoning: Optional[str] = None
    emotional_state: Optional[str] = None
