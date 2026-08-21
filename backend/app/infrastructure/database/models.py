"""Tortoise ORM models for the memory engine.

Tables:
  - memory_vectors    : id, collection, vector (JSON-encoded list[float]),
                        payload (JSON-encoded dict), timestamps.
  - memory_history    : per-memory lifecycle events (ADD / UPDATE / DELETE).
  - chat_conversations: one row per conversation thread per user.
  - chat_messages     : one row per turn (user / assistant) in a conversation.

Chat history is intentionally separate from the typed-memory store:
memory ingestion extracts *facts* (preferences, decisions, plans);
chat history is the raw transcript. They serve different purposes.
"""

from __future__ import annotations

from tortoise import fields
from tortoise.models import Model


class MemoryVector(Model):
    """One row per stored memory embedding + payload."""

    id = fields.CharField(pk=True, max_length=64)
    collection = fields.CharField(max_length=64)
    vector_json = fields.TextField()
    payload_json = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "memory_vectors"
        indexes = [("collection",)]


class MemoryHistory(Model):
    """One row per lifecycle event on a memory row."""

    id = fields.CharField(pk=True, max_length=64)
    memory_id = fields.CharField(max_length=64)
    old_memory = fields.TextField(null=True)
    new_memory = fields.TextField(null=True)
    event = fields.CharField(max_length=16)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(null=True)
    is_deleted = fields.BooleanField(default=False)

    class Meta:
        table = "memory_history"
        indexes = [("memory_id",)]


class ChatConversation(Model):
    """A chat thread owned by a user.

    Title is auto-generated from the first user message (truncated to
    80 chars) so the sidebar list is readable without an extra LLM call
    on every message.
    """

    id = fields.CharField(pk=True, max_length=64)
    user = fields.ForeignKeyField(
        "models.User", related_name="conversations", on_delete=fields.CASCADE
    )
    title = fields.CharField(max_length=120)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "chat_conversations"
        indexes = [("user", "updated_at")]


class ChatMessage(Model):
    """One turn in a conversation — user message or assistant reply.

    `is_ingested` flips to True once the background drainer has
    extracted typed memories from a user message. Assistant messages
    never need ingesting — they don't carry new facts — so they're
    marked True at write time.

    `ingest_attempts` increments on every drain attempt; future
    work could use it to back off or quarantine rows that fail too
    many times in a row (today we just retry indefinitely).
    """

    id = fields.CharField(pk=True, max_length=64)
    conversation = fields.ForeignKeyField(
        "models.ChatConversation",
        related_name="messages",
        on_delete=fields.CASCADE,
    )
    role = fields.CharField(max_length=16)  # "user" | "assistant"
    content = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)
    is_ingested = fields.BooleanField(default=False)
    ingest_attempts = fields.IntField(default=0)

    class Meta:
        table = "chat_messages"
        indexes = [("conversation", "created_at"), ("is_ingested", "created_at")]
