"""Memory CRUD over the lifespan-managed Memory singleton.

All routes require a valid Bearer token; user_id is always read from
current_user.id, never from the request body — same auth boundary as
the chat route.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import current_user, get_memory
from app.api.schemas import (
    HistoryResponse,
    MemoryListResponse,
    MessageResponse,
)
from app.domains.auth.models import User
from app.domains.memory.service import Memory

router = APIRouter(prefix="/api/memories", tags=["memories"])


@router.get("")
async def list_memories(
    user: Annotated[User, Depends(current_user)],
    memory: Annotated[Memory, Depends(get_memory)],
    limit: int = Query(default=100, ge=1, le=500),
) -> MemoryListResponse:
    result = await memory.get_all(user_id=user.id, limit=limit)
    return MemoryListResponse(results=result.get("results", []))


@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: str,
    user: Annotated[User, Depends(current_user)],
    memory: Annotated[Memory, Depends(get_memory)],
) -> MessageResponse:
    # Confirm the memory belongs to this user before deleting.
    existing = await memory.get(memory_id)
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="memory not found"
        )
    if existing.get("user_id") != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="memory not found"
        )
    await memory.delete(memory_id)
    return MessageResponse(message="Memory deleted successfully!")


@router.delete("")
async def delete_all_memories(
    user: Annotated[User, Depends(current_user)],
    memory: Annotated[Memory, Depends(get_memory)],
) -> MessageResponse:
    await memory.delete_all(user_id=user.id)
    return MessageResponse(message="Memories deleted successfully!")


@router.get("/{memory_id}/history")
async def memory_history(
    memory_id: str,
    user: Annotated[User, Depends(current_user)],
    memory: Annotated[Memory, Depends(get_memory)],
) -> HistoryResponse:
    existing = await memory.get(memory_id)
    if existing is None or existing.get("user_id") != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="memory not found"
        )
    history = await memory.history(memory_id)
    return HistoryResponse(history=history)