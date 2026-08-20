"""Background memory-ingest drainer.

Two entry points:
  - `drain_one(memory, message_id)` — fire-and-forget from the chat
    route for the message the user just sent. Returns once that row
    is ingested or its retry counter has bumped.
  - `drain_loop(memory, interval)` — periodic batch drainer started
    from FastAPI's lifespan. Picks up any rows that survived a
    crash / restart, runs them through `Memory.add()` one at a time
    so we never burst the provider.

Both paths share the same shared rate-limited LLM/embed clients
(see `app.core.rate_limit`), so the foreground chat reply and the
background drain compete for the same bucket. That's the budget
— drainer work gets squeezed out while a chat is in flight, and
catches up between requests.
"""

from __future__ import annotations

import asyncio
import logging

from app.domains.memory.service import Memory
from app.infrastructure.database.models import ChatMessage

logger = logging.getLogger(__name__)

# How many messages to pull per drainer iteration. We process them
# sequentially, not in parallel, so this bounds LLM-call churn per
# tick — not concurrency.
_BATCH_SIZE = 10

# Sleep between idle drain-loop iterations. Small enough that a
# quiet conversation doesn't visibly lag; large enough that we're
# not pointlessly hitting SQLite on a server with no work to do.
_IDLE_INTERVAL_SECONDS = 5.0


async def drain_one(memory: Memory, message_id: str) -> bool:
    """Ingest a single chat message into the memory store.

    Idempotent: re-running on a row that's already ingested is a
    no-op. Re-running on a row whose prior attempt partially
    succeeded is also safe — `Memory.add()` resolves ADD/UPDATE/
    DELETE against existing facts, so a duplicated pass either
    no-ops or cleanly updates.

    Returns True if a new ingest happened this call, False otherwise
    (already ingested, missing row, role isn't user, or ingest
    raised).
    """
    msg = await (
        ChatMessage.get_or_none(id=message_id)
        .select_related("conversation__user")
    )
    if msg is None:
        return False
    if msg.is_ingested:
        return False
    if msg.role != "user":
        # Assistant turns don't carry new facts; mark done and bail.
        msg.is_ingested = True
        await msg.save(update_fields=["is_ingested"])
        return False

    user = msg.conversation.user
    try:
        await memory.add(msg.content, user_id=user.id)
    except Exception:
        msg.ingest_attempts = (msg.ingest_attempts or 0) + 1
        await msg.save(update_fields=["ingest_attempts"])
        logger.exception(
            "Background ingest failed for message %s (attempt %d)",
            message_id,
            msg.ingest_attempts,
        )
        return False

    msg.is_ingested = True
    msg.ingest_attempts = (msg.ingest_attempts or 0) + 1
    await msg.save(update_fields=["is_ingested", "ingest_attempts"])
    logger.info(
        "Ingested message %s (attempt %d) for user %s",
        message_id,
        msg.ingest_attempts,
        user.id,
    )
    return True


async def drain_pending_batch(
    memory: Memory,
    batch_size: int = _BATCH_SIZE,
) -> int:
    """Ingest up to `batch_size` pending messages, sequentially.

    Returns the count that was actually newly ingested this call.
    Used by both the chat-route fire-and-forget path (via
    `drain_one` on the just-sent message) and the periodic
    `drain_loop` (which sweeps up leftovers).
    """
    pending = await (
        ChatMessage.filter(is_ingested=False, role="user")
        .order_by("created_at")
        .limit(batch_size)
    )
    count = 0
    for msg in pending:
        # Each call awaits — no parallel ingest. The shared LLM
        # rate limiter already serializes chat completions inside
        # Memory.add(), so doing it per-message here is the natural
        # pacing.
        if await drain_one(memory, msg.id):
            count += 1
    return count


async def drain_loop(
    memory: Memory,
    interval: float = _IDLE_INTERVAL_SECONDS,
) -> None:
    """Run `drain_pending_batch` on a loop until cancelled.

    Started from FastAPI's lifespan; cancellation comes from the
    shutdown path. Exceptions inside the loop are logged and the
    loop keeps running — a transient DB hiccup shouldn't kill the
    drainer permanently.
    """
    logger.info("Background ingest drainer started (interval=%.1fs)", interval)
    try:
        while True:
            try:
                await drain_pending_batch(memory)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("Drain loop iteration failed")
            await asyncio.sleep(interval)
    except asyncio.CancelledError:
        logger.info("Background ingest drainer stopped")
        raise
