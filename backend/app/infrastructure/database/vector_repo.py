"""
Vector storage using SQLite for simplicity.
A direct implementation that stores vectors and supports similarity search.
"""

import json
import logging
import math
from datetime import datetime
from typing import Any, Optional

import aiosqlite

from config import VectorStoreConfig

logger = logging.getLogger(__name__)


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """Calculate cosine similarity between two vectors.

    Args:
        vec1: First vector.
        vec2: Second vector.

    Returns:
        Cosine similarity score between -1 and 1.
    """
    if len(vec1) != len(vec2):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec1, vec2, strict=True))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(b * b for b in vec2))

    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    return dot_product / (magnitude1 * magnitude2)


class SearchResult:
    """Represents a search result from the vector store."""

    def __init__(self, id: str, payload: dict[str, Any], score: float):
        self.id = id
        self.payload = payload
        self.score = score


class VectorStore:
    """SQLite-based vector storage with cosine similarity search."""

    def __init__(self, config: Optional[VectorStoreConfig] = None):
        """Initialize vector store.

        Args:
            config: Optional vector store configuration.
        """
        self.config = config or VectorStoreConfig()
        self.db_path = self.config.db_path
        self.collection_name = self.config.collection_name
        self._connection: Optional[aiosqlite.Connection] = None
        self._initialized = False

    async def _get_connection(self) -> aiosqlite.Connection:
        """Get or create the database connection."""
        if self._connection is None:
            self._connection = await aiosqlite.connect(
                self.db_path, check_same_thread=False
            )
            self._connection.isolation_level = None

        if not self._initialized:
            await self._create_tables()
            self._initialized = True

        return self._connection

    async def _create_tables(self) -> None:
        """Create the necessary tables."""
        conn = self._connection
        if conn is None:
            raise RuntimeError("Vector store connection is not initialized")

        # Vectors table - stores the actual vectors
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS vectors (
                id TEXT PRIMARY KEY,
                collection TEXT NOT NULL,
                vector TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME
            )
        """
        )

        # Create index on collection
        await conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_vectors_collection 
            ON vectors(collection)
        """
        )

        logger.info("Vector store tables created successfully")

    async def insert(
        self,
        vectors: list[list[float]],
        ids: list[str],
        payloads: list[dict[str, Any]],
    ) -> list[str]:
        """Insert vectors into the store.

        Args:
            vectors: List of embedding vectors.
            ids: List of IDs for the vectors.
            payloads: List of payloads (metadata) for each vector.

        Returns:
            List of inserted IDs.
        """
        if len(vectors) != len(ids) or len(vectors) != len(payloads):
            raise ValueError("vectors, ids, and payloads must have the same length")

        conn = await self._get_connection()
        now = datetime.utcnow().isoformat()

        for vector, vec_id, payload in zip(vectors, ids, payloads, strict=True):
            await conn.execute(
                """
                INSERT OR REPLACE INTO vectors (id, collection, vector, payload, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    vec_id,
                    self.collection_name,
                    json.dumps(vector),
                    json.dumps(payload),
                    now,
                    now,
                ),
            )

        logger.debug(f"Inserted {len(vectors)} vectors into {self.collection_name}")
        return ids

    async def search(
        self,
        query: str,
        vectors: list[float],
        limit: int = 10,
        filters: Optional[dict[str, Any]] = None,
    ) -> list[SearchResult]:
        """Search for similar vectors.

        Args:
            query: The query text (unused, kept for API compatibility).
            vectors: The query vector to search against.
            limit: Maximum number of results to return.
            filters: Optional filters to apply (e.g., user_id, agent_id).

        Returns:
            List of SearchResult objects ordered by similarity.
        """
        conn = await self._get_connection()

        # Fetch all vectors from the collection
        cursor = await conn.execute(
            """
            SELECT id, vector, payload
            FROM vectors
            WHERE collection = ?
            """,
            (self.collection_name,),
        )

        rows = await cursor.fetchall()

        results = []
        for row in rows:
            vec_id = row[0]
            stored_vector = json.loads(row[1])
            payload = json.loads(row[2])

            # Apply filters
            if filters:
                match = True
                for key, value in filters.items():
                    if key in payload and payload[key] != value:
                        match = False
                        break
                if not match:
                    continue

            # Calculate similarity
            score = cosine_similarity(vectors, stored_vector)
            results.append(SearchResult(vec_id, payload, score))

        # Sort by score descending and limit
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:limit]

    async def get(self, vector_id: str) -> Optional[SearchResult]:
        """Get a vector by ID.

        Args:
            vector_id: The ID of the vector to get.

        Returns:
            SearchResult if found, None otherwise.
        """
        conn = await self._get_connection()

        cursor = await conn.execute(
            """
            SELECT id, payload
            FROM vectors
            WHERE id = ? AND collection = ?
            """,
            (vector_id, self.collection_name),
        )

        row = await cursor.fetchone()

        if row:
            return SearchResult(row[0], json.loads(row[1]), 1.0)
        return None

    async def update(
        self,
        vector_id: str,
        vector: Optional[list[float]] = None,
        payload: Optional[dict[str, Any]] = None,
    ) -> bool:
        """Update a vector.

        Args:
            vector_id: The ID of the vector to update.
            vector: Optional new vector.
            payload: Optional new payload.

        Returns:
            True if updated, False if not found.
        """
        conn = await self._get_connection()

        # Get existing record
        existing = await self.get(vector_id)
        if not existing:
            return False

        now = datetime.utcnow().isoformat()

        if vector is not None and payload is not None:
            await conn.execute(
                """
                UPDATE vectors SET vector = ?, payload = ?, updated_at = ?
                WHERE id = ? AND collection = ?
                """,
                (
                    json.dumps(vector),
                    json.dumps(payload),
                    now,
                    vector_id,
                    self.collection_name,
                ),
            )
        elif vector is not None:
            await conn.execute(
                """
                UPDATE vectors SET vector = ?, updated_at = ?
                WHERE id = ? AND collection = ?
                """,
                (json.dumps(vector), now, vector_id, self.collection_name),
            )
        elif payload is not None:
            await conn.execute(
                """
                UPDATE vectors SET payload = ?, updated_at = ?
                WHERE id = ? AND collection = ?
                """,
                (json.dumps(payload), now, vector_id, self.collection_name),
            )

        logger.debug(f"Updated vector: {vector_id}")
        return True

    async def delete(self, vector_id: str) -> bool:
        """Delete a vector.

        Args:
            vector_id: The ID of the vector to delete.

        Returns:
            True if deleted, False if not found.
        """
        conn = await self._get_connection()

        cursor = await conn.execute(
            """
            DELETE FROM vectors
            WHERE id = ? AND collection = ?
            """,
            (vector_id, self.collection_name),
        )

        deleted = cursor.rowcount > 0
        if deleted:
            logger.debug(f"Deleted vector: {vector_id}")
        return deleted

    async def list(
        self,
        filters: Optional[dict[str, Any]] = None,
        limit: int = 100,
    ) -> tuple[list[SearchResult], int]:
        """List all vectors in the collection.

        Args:
            filters: Optional filters to apply.
            limit: Maximum number of results to return.

        Returns:
            Tuple of (list of SearchResult, total count).
        """
        conn = await self._get_connection()

        cursor = await conn.execute(
            """
            SELECT id, payload
            FROM vectors
            WHERE collection = ?
            """,
            (self.collection_name,),
        )

        rows = await cursor.fetchall()

        results = []
        for row in rows:
            vec_id = row[0]
            payload = json.loads(row[1])

            # Apply filters
            if filters:
                match = True
                for key, value in filters.items():
                    if key in payload and payload[key] != value:
                        match = False
                        break
                if not match:
                    continue

            results.append(SearchResult(vec_id, payload, 1.0))

        total = len(results)
        return results[:limit], total

    async def reset(self) -> None:
        """Delete all vectors in the collection."""
        conn = await self._get_connection()

        await conn.execute(
            """
            DELETE FROM vectors WHERE collection = ?
            """,
            (self.collection_name,),
        )

        logger.info(f"Reset collection: {self.collection_name}")

    async def close(self) -> None:
        """Close the database connection."""
        if self._connection:
            await self._connection.close()
            self._connection = None
            self._initialized = False
            logger.info("Vector store connection closed")
