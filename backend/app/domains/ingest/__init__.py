"""Background memory-ingest drainer.

Runs after the chat route has returned its reply to the user. Each
pending user `ChatMessage` (one that hasn't been processed yet) gets
fed through `Memory.add()` so its facts land in the typed-memory store
+ the graph. Drainer work shares the same rate-limited LLM/embed
clients as the foreground chat path, so total outbound RPS stays
under the provider cap.

Ponytail: `record_turn` writes the raw row with `is_ingested=False`,
the chat route returns the reply, a fire-and-forget `drain_one`
ingests that single message. Plus a periodic `drain_loop` that picks
up anything left behind by a crash or a restart.
"""

from app.domains.ingest.drain import (
    drain_loop,
    drain_one,
    drain_pending_batch,
)

__all__ = ["drain_one", "drain_pending_batch", "drain_loop"]
