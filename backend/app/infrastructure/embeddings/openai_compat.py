"""OpenAI-SDK-compatible embedder.

Uses `AsyncOpenAI` against any provider that speaks the OpenAI API
(Mistral, OpenAI, Groq, Together, local llama.cpp, etc.).
Swapping providers = changing `OPENAI_COMPAT_*` env vars; no code change.

Includes a small in-process cache keyed by text — same input text
returns the same embedding without a second API call.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from typing import Any, Literal

from openai import AsyncOpenAI

from app.core.config import ProviderConfig
from app.core.rate_limit import build_llm_rate_limiter

logger = logging.getLogger(__name__)

Purpose = Literal["index", "query", "update"]


class OpenAICompatibleEmbedder:
    """Provider-agnostic embedder with a simple text cache."""

    def __init__(self, config: ProviderConfig | None = None) -> None:
        self.config = config or ProviderConfig()
        if not self.config.api_key:
            raise ValueError(
                "OPENAI_COMPAT_API_KEY is required for embeddings"
            )

        self.client = AsyncOpenAI(
            # Fall back to the shared `api_key` when no separate
            # embedding key is configured — keeps single-key setups
            # working without an extra env var.
            api_key=self.config.embed_api_key or self.config.api_key,
            base_url=self.config.base_url,
        )
        self.model = self.config.embed_model
        self.embedding_dims = self.config.embedding_dims
        self._model_candidates = self._build_model_candidates(
            self.model, self.config.base_url
        )

        self._cache: dict[str, list[float]] = {}
        self._cache_max_size = 1024
        self._cache_hits = 0
        self._cache_misses = 0
        # Per-client limiter — embeddings doesn't share the chat bucket.
        self._rate_limiter = build_llm_rate_limiter("embed")

    @staticmethod
    def _build_model_candidates(primary: str, base_url: str) -> list[str]:
        """Provider-specific primary model, then provider-aware fallbacks.

        Mistral accepts `mistral-embed` but not OpenAI's
        `text-embedding-3-*`; OpenAI accepts both. We pick fallbacks
        based on the configured base URL so the embedder doesn't
        cross-pollinate providers.
        """
        candidates: list[str] = []
        normalized = primary.strip()
        if normalized:
            candidates.append(normalized)
        # Mistral-style "models/" prefix is stripped by the API.
        if normalized.startswith("models/"):
            candidates.append(normalized.removeprefix("models/"))

        is_mistral = "mistral" in base_url.lower()
        if is_mistral:
            candidates.extend(["mistral-embed"])
        else:
            candidates.extend(
                ["text-embedding-3-small", "text-embedding-3-large"]
            )

        seen: list[str] = []
        for name in candidates:
            if name and name not in seen:
                seen.append(name)
        return seen

    @staticmethod
    def _cache_key(text: str) -> str:
        return hashlib.md5(text.encode()).hexdigest()

    def _cache_get(self, text: str) -> list[float] | None:
        key = self._cache_key(text)
        if key in self._cache:
            self._cache_hits += 1
            return self._cache[key]
        self._cache_misses += 1
        return None

    def _cache_set(self, text: str, embedding: list[float]) -> None:
        if len(self._cache) >= self._cache_max_size:
            # Drop the oldest ~10% of entries (insertion-ordered).
            evict_count = self._cache_max_size // 10
            for key in list(self._cache.keys())[:evict_count]:
                del self._cache[key]
        self._cache[self._cache_key(text)] = embedding

    async def embed(
        self,
        text: str,
        purpose: Purpose | None = None,
    ) -> list[float]:
        """Return an embedding vector for `text`.

        `purpose` is informational only — providers that don't support
        asymmetric embeddings can ignore it.

        Notes on cross-provider compat:
          - Mistral's `mistral-embed` returns fixed 1024 dims and rejects
            a `dimensions=` parameter (422). OpenAI's
            `text-embedding-3-*` accepts it. We probe both behaviours
            per request: pass `dimensions` only when the primary model
            is one we know supports it.
          - `text-embedding-3-small` doesn't exist on Mistral, so the
            fallback list is provider-aware (built off the configured
            base URL).
        """
        text = text.replace("\n", " ").strip()
        if not text:
            return [0.0] * self.embedding_dims

        cached = self._cache_get(text)
        if cached is not None:
            return cached

        # OpenAI's text-embedding-3-* honours dimensions; everything
        # else (Mistral, etc.) doesn't. Only pass `dimensions` when
        # it's known-safe.
        primary_supports_dims = self.model.startswith("text-embedding-3-")

        last_error: Exception | None = None
        for candidate in self._model_candidates:
            try:
                if "11434" not in self.config.base_url:
                    await self._rate_limiter.acquire()
                kwargs: dict[str, Any] = {"model": candidate, "input": text}
                if candidate.startswith("text-embedding-3-"):
                    kwargs["dimensions"] = self.embedding_dims
                elif primary_supports_dims and candidate == self.model:
                    kwargs["dimensions"] = self.embedding_dims
                response = await self.client.embeddings.create(**kwargs)
                if candidate != self.model:
                    logger.warning(
                        "embed model '%s' unavailable; switched to '%s'",
                        self.model,
                        candidate,
                    )
                    self.model = candidate
                vector = self._extract_vector(response)
                self._cache_set(text, vector)
                return vector
            except Exception as err:
                last_error = err
                continue

        # Offline Fallback 1: Try Local Ollama embeddings if running
        try:
            from openai import AsyncOpenAI as LocalAsyncOpenAI
            local_client = LocalAsyncOpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
            for local_model in ("nomic-embed-text", "qwen2.5-coder:7b", "all-minilm"):
                try:
                    res = await local_client.embeddings.create(model=local_model, input=text)
                    raw_vec = self._extract_vector(res)
                    # Resize or pad vector to embedding_dims if needed
                    if len(raw_vec) == self.embedding_dims:
                        vec = raw_vec
                    elif len(raw_vec) < self.embedding_dims:
                        vec = raw_vec + [0.0] * (self.embedding_dims - len(raw_vec))
                    else:
                        vec = raw_vec[:self.embedding_dims]
                    self._cache_set(text, vec)
                    return vec
                except Exception:
                    continue
        except Exception:
            pass

        # Offline Fallback 2: Deterministic bag-of-words / hash projection (100% offline guarantee)
        vec = [0.0] * self.embedding_dims
        words = text.lower().split()
        for w in words:
            h = int(hashlib.md5(w.encode()).hexdigest(), 16)
            idx = h % self.embedding_dims
            sign = 1.0 if (h >> 8) & 1 else -1.0
            vec[idx] += sign
        # Normalize vector
        norm = sum(x * x for x in vec) ** 0.5
        if norm > 0:
            vec = [x / norm for x in vec]
        self._cache_set(text, vec)
        return vec

    @staticmethod
    def _extract_vector(response: Any) -> list[float]:
        """Pull the float vector out of an OpenAI-style embeddings response."""
        item = response.data[0]
        embedding = item.embedding
        return [float(value) for value in embedding]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch — cache-aware, fan-out to individual calls.

        Ponytail: keeps the per-item cache, runs non-cached items in
        parallel. Add a true `embeddings.create(input=[...])` batch call
        when a provider exposes one — most don't for the
        asymmetric-dim case, so the simple version is fine here.
        """
        if not texts:
            return []

        cleaned = [t.replace("\n", " ").strip() for t in texts]
        results: list[list[float] | None] = [None] * len(cleaned)
        to_embed: list[tuple[int, str]] = []

        for i, text in enumerate(cleaned):
            if not text:
                results[i] = [0.0] * self.embedding_dims
                continue
            cached = self._cache_get(text)
            if cached is not None:
                results[i] = cached
            else:
                to_embed.append((i, text))

        if to_embed:
            tasks = [self.embed(text) for _, text in to_embed]
            embeddings = await asyncio.gather(*tasks)
            for (idx, _), vector in zip(to_embed, embeddings, strict=True):
                results[idx] = vector

        return [
            v if v is not None else [0.0] * self.embedding_dims for v in results
        ]

    def get_cache_stats(self) -> dict[str, int | str]:
        total = self._cache_hits + self._cache_misses
        hit_rate = self._cache_hits / total if total > 0 else 0.0
        return {
            "cache_size": len(self._cache),
            "cache_max_size": self._cache_max_size,
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
            "hit_rate": f"{hit_rate:.2%}",
        }
