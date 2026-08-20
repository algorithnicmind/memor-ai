"""Per-memory history log on Tortoise ORM + SQLite.

One row per ADD / UPDATE / DELETE event on a memory. The table grows
monotonically and is queried by memory_id for change history or by
timestamp DESC for a global stream.

Same as the vector store: Tortoise owns connections; no DB state in
this class.
"""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from app.core.config import HistoryConfig
from app.infrastructure.database.models import MemoryHistory

logger = logging.getLogger(__name__)


def _row_to_dict(row: MemoryHistory) -> dict[str, Any]:
    return {
        "id": row.id,
        "memory_id": row.memory_id,
        "old_memory": row.old_memory,
        "new_memory": row.new_memory,
        "event": row.event,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "is_deleted": row.is_deleted,
    }


class HistoryStore:
    """Tortoise-backed history log."""

    def __init__(self, config: HistoryConfig | None = None) -> None:
        self.config = config or HistoryConfig()

    async def add_history(
        self,
        memory_id: str,
        event: str,
        old_memory: str | None = None,
        new_memory: str | None = None,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> str:
        record_id = str(uuid.uuid4())
        await MemoryHistory.create(
            id=record_id,
            memory_id=memory_id,
            old_memory=old_memory,
            new_memory=new_memory,
            event=event,
            created_at=created_at or datetime.now(UTC),
            updated_at=updated_at,
            is_deleted=False,
        )
        logger.debug("Added history record %s for memory %s", record_id, memory_id)
        return record_id

    async def get_history(self, memory_id: str) -> list[dict[str, Any]]:
        rows = (
            await MemoryHistory.filter(memory_id=memory_id)
            .order_by("created_at")
            .all()
        )
        return [_row_to_dict(r) for r in rows]

    async def get_all_history(self, limit: int = 100) -> list[dict[str, Any]]:
        rows = (
            await MemoryHistory.all().order_by("-created_at").limit(limit)
        )
        return [_row_to_dict(r) for r in rows]

    async def delete_history(self, memory_id: str) -> None:
        now = datetime.now(UTC)
        await MemoryHistory.filter(memory_id=memory_id).update(
            is_deleted=True, updated_at=now
        )
        logger.debug("Marked history as deleted for memory %s", memory_id)

    async def reset(self) -> None:
        await MemoryHistory.all().delete()
        logger.info("History table reset")

    async def close(self) -> None:
        # Tortoise owns the connection — no-op, kept for API symmetry.
        return None