"""Vector storage on top of Tortoise ORM + SQLite.

Vectors are stored as JSON-encoded lists in `MemoryVector.vector_json`;
cosine similarity is computed in Python after fetching the (small)
collection. This is intentionally a plain O(n) scan — the storage
project never carries more than a few thousand rows per user.

Tortoise init/close happens in the app lifespan, not here, so this
class holds zero connection state.
"""

from __future__ import annotations

import json
import logging
import math
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from app.core.config import VectorStoreConfig
from app.infrastructure.database.models import MemoryVector

logger = logging.getLogger(__name__)


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """Cosine similarity in [-1, 1]. Returns 0.0 for mismatched dims."""
    if len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2, strict=True))
    m1 = math.sqrt(sum(a * a for a in vec1))
    m2 = math.sqrt(sum(b * b for b in vec2))
    if m1 == 0 or m2 == 0:
        return 0.0
    return dot / (m1 * m2)


@dataclass(slots=True)
class SearchResult:
    id: str
    payload: dict[str, Any]
    score: float


def _row_to_result(row: MemoryVector, score: float) -> SearchResult:
    return SearchResult(
        id=row.id,
        payload=json.loads(row.payload_json),
        score=score,
    )


class VectorStore:
    """SQLite (Tortoise) vector store with cosine search."""

    def __init__(self, config: VectorStoreConfig | None = None) -> None:
        self.config = config or VectorStoreConfig()
        self.collection_name = self.config.collection_name

    async def insert(
        self,
        vectors: list[list[float]],
        ids: list[str],
        payloads: list[dict[str, Any]],
    ) -> list[str]:
        if not (len(vectors) == len(ids) == len(payloads)):
            raise ValueError("vectors, ids, and payloads must have the same length")
        for vec_id, vec, payload in zip(ids, vectors, payloads, strict=True):
            await MemoryVector.update_or_create(
                id=vec_id,
                defaults={
                    "collection": self.collection_name,
                    "vector_json": json.dumps(vec),
                    "payload_json": json.dumps(payload),
                },
            )
        logger.debug("Inserted %d vectors into %s", len(vectors), self.collection_name)
        return ids

    async def search(
        self,
        query: str,
        vectors: list[float],
        limit: int = 10,
        filters: Mapping[str, Any] | None = None,
    ) -> list[SearchResult]:
        rows = await MemoryVector.filter(collection=self.collection_name).all()
        results: list[SearchResult] = []
        for row in rows:
            payload = json.loads(row.payload_json)
            if filters and not _matches(payload, filters):
                continue
            stored = json.loads(row.vector_json)
            results.append(_row_to_result(row, cosine_similarity(vectors, stored)))
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]

    async def get(self, vector_id: str) -> SearchResult | None:
        row = await MemoryVector.get_or_none(id=vector_id, collection=self.collection_name)
        if row is None:
            return None
        return _row_to_result(row, 1.0)

    async def update(
        self,
        vector_id: str,
        vector: list[float] | None = None,
        payload: dict[str, Any] | None = None,
    ) -> bool:
        row = await MemoryVector.get_or_none(id=vector_id, collection=self.collection_name)
        if row is None:
            return False
        if vector is not None:
            row.vector_json = json.dumps(vector)
        if payload is not None:
            row.payload_json = json.dumps(payload)
        await row.save()
        return True

    async def delete(self, vector_id: str) -> bool:
        deleted = await MemoryVector.filter(
            id=vector_id, collection=self.collection_name
        ).delete()
        return bool(deleted)

    async def list(
        self,
        filters: Mapping[str, Any] | None = None,
        limit: int = 100,
    ) -> tuple[list[SearchResult], int]:
        rows = await MemoryVector.filter(collection=self.collection_name).all()
        results: list[SearchResult] = []
        for row in rows:
            payload = json.loads(row.payload_json)
            if filters and not _matches(payload, filters):
                continue
            results.append(_row_to_result(row, 1.0))
        total = len(results)
        return results[:limit], total

    async def reset(self) -> None:
        await MemoryVector.filter(collection=self.collection_name).delete()
        logger.info("Reset collection: %s", self.collection_name)

    async def close(self) -> None:
        # No-op: Tortoise owns the connection. Provided for symmetry
        # with the rest of the storage surface.
        return None


def _matches(payload: Mapping[str, Any], filters: Mapping[str, Any]) -> bool:
    return all(payload.get(key) == value for key, value in filters.items())