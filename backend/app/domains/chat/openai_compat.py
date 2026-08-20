"""OpenAI-SDK-compatible chat client.

The same `AsyncOpenAI` client is reused for both chat and embeddings
elsewhere in the project — only the call surface changes. Tool
definitions for the graph store's entity extraction / relation
establishment / graph deletion live here so the graph module doesn't
have to know about JSON-schema details.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
from typing import Any, cast

from openai import APIStatusError, AsyncOpenAI, RateLimitError

from app.core.config import ProviderConfig
from app.core.rate_limit import AsyncRateLimiter, build_llm_rate_limiter

logger = logging.getLogger(__name__)


# ---- Tool schemas (JSON-schema) for the graph store pipeline ----------

EXTRACT_ENTITIES_TOOL: dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "extract_entities",
        "description": "Extract entities and their types from the text.",
        "parameters": {
            "type": "object",
            "properties": {
                "entities": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "entity": {
                                "type": "string",
                                "description": "Name or identifier of the entity.",
                            },
                            "entity_type": {
                                "type": "string",
                                "description": "Type or category of the entity.",
                            },
                        },
                        "required": ["entity", "entity_type"],
                    },
                }
            },
            "required": ["entities"],
        },
    },
}


RELATIONS_TOOL: dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "establish_relationships",
        "description": "Establish relationships among the entities based on the provided text.",
        "parameters": {
            "type": "object",
            "properties": {
                "entities": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "source": {"type": "string"},
                            "relationship": {"type": "string"},
                            "destination": {"type": "string"},
                        },
                        "required": ["source", "relationship", "destination"],
                    },
                }
            },
            "required": ["entities"],
        },
    },
}


DELETE_MEMORY_TOOL: dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "delete_graph_memory",
        "description": "Delete the relationship between two nodes.",
        "parameters": {
            "type": "object",
            "properties": {
                "source": {"type": "string"},
                "relationship": {"type": "string"},
                "destination": {"type": "string"},
            },
            "required": ["source", "relationship", "destination"],
        },
    },
}


# ---- Client --------------------------------------------------------------


class OpenAICompatibleLLM:
    """Chat client over the OpenAI SDK.

    Any OpenAI-SDK-compatible provider works — Mistral, OpenAI, Groq,
    Together, etc. Configure via `OPENAI_COMPAT_*` env vars.
    """

    def __init__(self, config: ProviderConfig | None = None) -> None:
        self.config = config or ProviderConfig()
        if not self.config.api_key:
            raise ValueError(
                "OPENAI_COMPAT_API_KEY is required to construct an LLM client"
            )
        self.client = AsyncOpenAI(
            api_key=self.config.api_key,
            base_url=self.config.base_url,
        )
        self.model = self.config.chat_model
        self._rate_limiter: AsyncRateLimiter = build_llm_rate_limiter("chat")

    @staticmethod
    def _parse_response(
        response: Any, tools: list[dict[str, Any]] | None
    ) -> str | dict[str, Any]:
        if not tools:
            content = response.choices[0].message.content
            return content if isinstance(content, str) else ""
        parsed: dict[str, Any] = {
            "content": response.choices[0].message.content,
            "tool_calls": [],
        }
        for tool_call in response.choices[0].message.tool_calls or []:
            arguments = tool_call.function.arguments
            if isinstance(arguments, str):
                with contextlib.suppress(json.JSONDecodeError):
                    arguments = json.loads(arguments)
            parsed["tool_calls"].append(
                {"name": tool_call.function.name, "arguments": arguments}
            )
        return parsed

    async def generate_response(
        self,
        messages: list[dict[str, str]],
        response_format: dict[str, Any] | None = None,
        tools: list[dict[str, Any]] | None = None,
        tool_choice: str = "auto",
        **kwargs: Any,
    ) -> str | dict[str, Any]:
        params: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
        }
        if response_format:
            params["response_format"] = response_format
        if tools:
            params["tools"] = tools
            params["tool_choice"] = tool_choice

        # Retry with exponential backoff on 429 / transient 5xx — Mistral
        # free tier rate-limits aggressively and a chat-store call may
        # chain 3+ requests back-to-back.
        # Per-client rate limiter (see app.core.rate_limit) keeps us
        # below the burst window so the provider's 429 rarely fires.
        await self._rate_limiter.acquire()
        last_error: Exception | None = None
        for attempt in range(5):
            try:
                response = await self.client.chat.completions.create(
                    **cast(Any, params)
                )
                return self._parse_response(response, tools)
            except RateLimitError as err:
                last_error = err
                wait = min(2 ** attempt, 30)
                logger.warning(
                    "LLM rate-limited (attempt %d), retrying in %ds",
                    attempt + 1,
                    wait,
                )
                await asyncio.sleep(wait)
                # Re-acquire after the backoff so we don't burst again.
                await self._rate_limiter.acquire()
            except APIStatusError as err:
                # 5xx is transient; 4xx (except 429) is not.
                if err.status_code >= 500:
                    last_error = err
                    wait = min(2 ** attempt, 30)
                    logger.warning(
                        "LLM %d (attempt %d), retrying in %ds",
                        err.status_code,
                        attempt + 1,
                        wait,
                    )
                    await asyncio.sleep(wait)
                    await self._rate_limiter.acquire()
                else:
                    raise
        if last_error is not None:
            raise last_error
        raise RuntimeError("LLM unreachable after retries")

    async def chat(self, message: str, system_prompt: str | None = None) -> str:
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": message})
        response = await self.generate_response(messages)
        return response if isinstance(response, str) else response.get("content", "")