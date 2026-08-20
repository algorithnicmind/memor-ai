"""Tortoise ORM models for the memory engine.

Tables:
  - memory_vectors : id, collection, vector (JSON-encoded list[float]),
                     payload (JSON-encoded dict), timestamps.
  - memory_history : per-memory lifecycle events (ADD / UPDATE / DELETE).

Both are SQLite-friendly; vector math runs in Python after fetch (the
collection scale is small enough that an O(n) scan is fine).
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
