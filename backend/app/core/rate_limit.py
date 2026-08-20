"""Async rate limiter for outbound LLM calls.

One `AsyncRateLimiter` per kind (chat / embed), shared by every
client of that kind in the process — `Memory.llm` and
`GraphStore.llm` both funnel through the same chat bucket, so a
configured `LLM_CHAT_RATE_LIMIT_RPS` actually reflects the rate
the provider sees. Chat and embeddings have independent buckets so
two API keys get their own quota.

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
    """Return the shared per-kind limiter, constructing it on first use.

    Two `OpenAICompatibleLLM` instances exist per process (one in
    `Memory`, one in `GraphStore`), and same for embedders. Each one
    building its own limiter doubles the effective RPS — and on
    Mistral's free-tier 1 RPS, two 0.8 RPS buckets routinely produce
    bursts that 429. Sharing the bucket per kind makes the documented
    `LLM_CHAT_RATE_LIMIT_RPS` / `LLM_EMBED_RATE_LIMIT_RPS` actually
    hold across every client that talks to the same provider key.

    `LLM_CHAT_RATE_LIMIT_RPS` (default 0.8) and
    `LLM_EMBED_RATE_LIMIT_RPS` (default 0.8) set the rates.
    """
    global _chat_limiter, _embed_limiter  # noqa: PLW0603 — intentional module-level cache
    from app.core.config import get_config_from_env

    cfg = get_config_from_env().llm
    if kind == "chat":
        if _chat_limiter is None:
            _chat_limiter = AsyncRateLimiter(rate_per_second=cfg.chat_rate_limit_rps)
        return _chat_limiter
    if _embed_limiter is None:
        _embed_limiter = AsyncRateLimiter(rate_per_second=cfg.embed_rate_limit_rps)
    return _embed_limiter


_chat_limiter: AsyncRateLimiter | None = None
_embed_limiter: AsyncRateLimiter | None = None
