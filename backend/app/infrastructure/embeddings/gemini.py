"""
Gemini Embeddings implementation.
Direct implementation using Google GenAI for text embeddings.
Includes LRU caching for improved performance.
"""

import asyncio
import hashlib
import logging
from typing import Literal

from google import genai
from google.genai import types

from config import EmbedderConfig

logger = logging.getLogger(__name__)


class GeminiEmbedding:
    """Google Gemini embedding model with caching."""

    def __init__(self, config: EmbedderConfig | None = None) -> None:
        """Initialize the Gemini embedding model.

        Args:
            config: Optional embedder configuration. Uses defaults if not provided.
        """
        self.config = config or EmbedderConfig()

        if not self.config.api_key:
            raise ValueError("GOOGLE_API_KEY is required for Gemini embeddings")

        self.client = genai.Client(api_key=self.config.api_key)
        self.model = self.config.model
        self.embedding_dims = self.config.embedding_dims
        self._model_candidates = self._build_model_candidates(self.model)

        # In-memory cache for embeddings (simple LRU-like dict with max size)
        self._cache: dict[str, list[float]] = {}
        self._cache_max_size = 1000
        self._cache_hits = 0
        self._cache_misses = 0

    @staticmethod
    def _build_model_candidates(primary_model: str) -> list[str]:
        candidates: list[str] = []

        normalized = primary_model.strip()
        if normalized:
            candidates.append(normalized)

        if normalized.startswith("models/"):
            candidates.append(normalized.removeprefix("models/"))

        candidates.extend(["text-embedding-004", "gemini-embedding-001"])

        unique_candidates: list[str] = []
        for model_name in candidates:
            if model_name and model_name not in unique_candidates:
                unique_candidates.append(model_name)

        return unique_candidates

    def _get_cache_key(self, text: str) -> str:
        """Generate a cache key for the text."""
        return hashlib.md5(text.encode()).hexdigest()

    def _cache_get(self, text: str) -> list[float] | None:
        """Get embedding from cache if exists."""
        key = self._get_cache_key(text)
        if key in self._cache:
            self._cache_hits += 1
            return self._cache[key]
        self._cache_misses += 1
        return None

    def _cache_set(self, text: str, embedding: list[float]) -> None:
        """Store embedding in cache."""
        # Simple eviction: if cache is full, remove oldest entries
        if len(self._cache) >= self._cache_max_size:
            # Remove first 10% of entries
            keys_to_remove = list(self._cache.keys())[: self._cache_max_size // 10]
            for key in keys_to_remove:
                del self._cache[key]

        key = self._get_cache_key(text)
        self._cache[key] = embedding

    async def embed(
        self,
        text: str,
        memory_action: Literal["add", "search", "update"] | None = None,
    ) -> list[float]:
        """Get the embedding for the given text.

        Args:
            text: The text to embed.
            memory_action: Optional action type (add, search, update). Currently unused but kept for API compatibility.

        Returns:
            The embedding vector as a list of floats.
        """
        # Clean the text
        text = text.replace("\n", " ").strip()

        if not text:
            return [0.0] * self.embedding_dims

        # Check cache first
        cached = self._cache_get(text)
        if cached is not None:
            return cached

        config = types.EmbedContentConfig(output_dimensionality=self.embedding_dims)

        response = None
        last_error: Exception | None = None
        for candidate_model in self._model_candidates:
            try:
                response = await asyncio.to_thread(
                    self.client.models.embed_content,
                    model=candidate_model,
                    contents=text,
                    config=config,
                )
                if candidate_model != self.model:
                    logger.warning(
                        "Embedding model '%s' unavailable; switched to '%s'",
                        self.model,
                        candidate_model,
                    )
                    self.model = candidate_model
                break
            except Exception as error:
                last_error = error
                continue

        if response is None:
            if last_error is not None:
                raise last_error
            raise RuntimeError("Failed to generate embeddings")

        embeddings = response.embeddings
        if not embeddings or embeddings[0].values is None:
            return [0.0] * self.embedding_dims
        embedding = [float(value) for value in embeddings[0].values]

        # Store in cache
        self._cache_set(text, embedding)

        return embedding

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed multiple texts efficiently.

        Uses caching to avoid recomputing embeddings for duplicate texts.
        Processes non-cached texts in parallel.

        Args:
            texts: List of texts to embed.

        Returns:
            List of embedding vectors.
        """
        if not texts:
            return []

        # Clean all texts
        cleaned_texts = [t.replace("\n", " ").strip() for t in texts]

        # Check which texts are already cached
        results: list[list[float] | None] = [None] * len(cleaned_texts)
        texts_to_embed: list[tuple[int, str]] = []

        for i, text in enumerate(cleaned_texts):
            if not text:
                results[i] = [0.0] * self.embedding_dims
            else:
                cached = self._cache_get(text)
                if cached is not None:
                    results[i] = cached
                else:
                    texts_to_embed.append((i, text))

        # Batch embed non-cached texts using parallel requests
        if texts_to_embed:

            async def embed_single(idx: int, text: str) -> tuple[int, list[float]]:
                embedding = await self.embed(text)
                return idx, embedding

            tasks = [embed_single(idx, text) for idx, text in texts_to_embed]
            embeddings = await asyncio.gather(*tasks)

            for idx, embedding in embeddings:
                results[idx] = embedding

        return [embedding if embedding is not None else [0.0] * self.embedding_dims for embedding in results]

    def get_cache_stats(self) -> dict[str, int | str]:
        """Get cache statistics for monitoring."""
        total = self._cache_hits + self._cache_misses
        hit_rate = self._cache_hits / total if total > 0 else 0
        return {
            "cache_size": len(self._cache),
            "cache_max_size": self._cache_max_size,
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
            "hit_rate": f"{hit_rate:.2%}",
        }
