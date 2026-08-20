"""
SQLite storage for memory history using aiosqlite.
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Optional

import aiosqlite

from app.core.config import HistoryConfig

logger = logging.getLogger(__name__)


class SQLiteStorage:
    """SQLite storage for memory history."""

    def __init__(self, config: Optional[HistoryConfig] = None):
        """Initialize SQLite storage.

        Args:
            config: Optional history configuration.
        """
        self.config = config or HistoryConfig()
        self.db_path = self.config.db_path
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
            raise RuntimeError("SQLite connection is not initialized")

        # History table
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS history (
                id TEXT PRIMARY KEY,
                memory_id TEXT NOT NULL,
                old_memory TEXT,
                new_memory TEXT,
                event TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                is_deleted INTEGER DEFAULT 0
            )
        """
        )

        # Create index on memory_id
        await conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_history_memory_id 
            ON history(memory_id)
        """
        )

        logger.info("SQLite tables created successfully")

    async def add_history(
        self,
        memory_id: str,
        event: str,
        old_memory: Optional[str] = None,
        new_memory: Optional[str] = None,
        created_at: Optional[str] = None,
        updated_at: Optional[str] = None,
    ) -> str:
        """Add a history record.

        Args:
            memory_id: The memory ID this history is for.
            event: The event type (ADD, UPDATE, DELETE).
            old_memory: The old memory content (for updates).
            new_memory: The new memory content.
            created_at: Optional creation timestamp.
            updated_at: Optional update timestamp.

        Returns:
            The history record ID.
        """
        conn = await self._get_connection()

        record_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        await conn.execute(
            """
            INSERT INTO history (
                id, memory_id, old_memory, new_memory, event,
                created_at, updated_at, is_deleted
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record_id,
                memory_id,
                old_memory,
                new_memory,
                event,
                created_at or now,
                updated_at,
                0,
            ),
        )

        logger.debug(f"Added history record: {record_id} for memory: {memory_id}")
        return record_id

    async def get_history(self, memory_id: str) -> list[dict[str, Any]]:
        """Get history records for a memory.

        Args:
            memory_id: The memory ID to get history for.

        Returns:
            List of history records.
        """
        conn = await self._get_connection()

        cursor = await conn.execute(
            """
            SELECT id, memory_id, old_memory, new_memory, event,
                   created_at, updated_at, is_deleted
            FROM history
            WHERE memory_id = ?
            ORDER BY created_at ASC
            """,
            (memory_id,),
        )

        rows = await cursor.fetchall()

        return [
            {
                "id": row[0],
                "memory_id": row[1],
                "old_memory": row[2],
                "new_memory": row[3],
                "event": row[4],
                "created_at": row[5],
                "updated_at": row[6],
                "is_deleted": bool(row[7]),
            }
            for row in rows
        ]

    async def get_all_history(self, limit: int = 100) -> list[dict[str, Any]]:
        """Get all history records.

        Args:
            limit: Maximum number of records to return.

        Returns:
            List of history records.
        """
        conn = await self._get_connection()

        cursor = await conn.execute(
            """
            SELECT id, memory_id, old_memory, new_memory, event,
                   created_at, updated_at, is_deleted
            FROM history
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        )

        rows = await cursor.fetchall()

        return [
            {
                "id": row[0],
                "memory_id": row[1],
                "old_memory": row[2],
                "new_memory": row[3],
                "event": row[4],
                "created_at": row[5],
                "updated_at": row[6],
                "is_deleted": bool(row[7]),
            }
            for row in rows
        ]

    async def delete_history(self, memory_id: str) -> None:
        """Mark history records as deleted for a memory.

        Args:
            memory_id: The memory ID to delete history for.
        """
        conn = await self._get_connection()

        await conn.execute(
            """
            UPDATE history SET is_deleted = 1, updated_at = ?
            WHERE memory_id = ?
            """,
            (datetime.utcnow().isoformat(), memory_id),
        )

        logger.debug(f"Marked history as deleted for memory: {memory_id}")

    async def reset(self) -> None:
        """Reset the history table."""
        conn = await self._get_connection()
        await conn.execute("DELETE FROM history")
        logger.info("History table reset")

    async def close(self) -> None:
        """Close the database connection."""
        if self._connection:
            await self._connection.close()
            self._connection = None
            self._initialized = False
            logger.info("SQLite connection closed")
