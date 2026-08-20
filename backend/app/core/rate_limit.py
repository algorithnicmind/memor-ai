"""Async rate limiter for outbound LLM calls.

Each LLM-facing client (chat, embeddings) instantiates its own
`AsyncRateLimiter` so the budgets aren't shared — chat and
embeddings run on independent buckets. With Mistral's free-tier
limit of ~1 RPS, both clients default to 1.5 RPS but env vars
`LLM_CHAT_RATE_LIMIT_RPS` and `LLM_EMBED_RATE_LIMIT_RPS` tune
them independently.

Ponytail: a 1-line token bucket (capacity=1, refill=1/RPS) is enough
here. If we ever need bursts or per-key limits, swap in a real
bucket — but for "respect a single RPS, one at a time", this is the
simplest thing that holds.
"""

from __future__ import annotations

import asyncio
import time
from typing import Literal

ClientKind = Literal["chat", "embed"]


class AsyncRateLimiter:
    """Coalescing token bucket — capacity 1, refill `rate` per second.

    Capacity 1 means: at most one in-flight request. The `acquire()`
    call sleeps until the bucket has a token, so callers always
    succeed (no rejection / no back-pressure surfaced to the caller).
    """

    def __init__(self, rate_per_second: float) -> None:
        if rate_per_second <= 0:
            raise ValueError("rate_per_second must be > 0")
        self._interval = 1.0 / rate_per_second
        self._lock = asyncio.Lock()
        self._last: float = 0.0

    async def acquire(self) -> None:
        """Wait until the next request slot is free."""
        async with self._lock:
            now = time.monotonic()
            wait = self._last + self._interval - now
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = time.monotonic()


def build_llm_rate_limiter(kind: ClientKind) -> AsyncRateLimiter:
    """Build a fresh limiter per client, tuned by env.

    `LLM_CHAT_RATE_LIMIT_RPS` (default 1.5) and
    `LLM_EMBED_RATE_LIMIT_RPS` (default 1.5) set the rates.
    Each client calls this once on init so chat and embeddings
    have separate buckets.
    """
    from app.core.config import get_config_from_env

    cfg = get_config_from_env().llm
    rps = cfg.chat_rate_limit_rps if kind == "chat" else cfg.embed_rate_limit_rps
    return AsyncRateLimiter(rate_per_second=rps)
