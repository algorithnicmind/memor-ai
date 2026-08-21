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
    Together, etc. Also supports local Ollama switching dynamically.
    """

    def __init__(self, config: ProviderConfig | None = None) -> None:
        self.config = config or ProviderConfig()
        api_key = self.config.api_key or "ollama"
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=self.config.base_url,
        )
        self.local_client = AsyncOpenAI(
            api_key="ollama",
            base_url="http://localhost:11434/v1",
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
        model: str | None = None,
        provider: str | None = None,
        **kwargs: Any,
    ) -> str | dict[str, Any]:
        # Determine whether to use local Ollama or cloud client
        is_local = (
            provider in ("local", "ollama")
            or (model and ("qwen" in model.lower() or "llama" in model.lower() or "ollama" in model.lower()))
            or ("11434" in self.config.base_url)
        )
        active_client = self.local_client if is_local else self.client
        active_model = model or (self.model if not is_local else "qwen2.5-coder:7b")

        params: dict[str, Any] = {
            "model": active_model,
            "messages": messages,
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
        }
        if response_format:
            params["response_format"] = response_format
        if tools:
            params["tools"] = tools
            params["tool_choice"] = tool_choice

        # When calling local Ollama, rate limiter is not strictly needed, but safe
        if not is_local:
            await self._rate_limiter.acquire()

        last_error: Exception | None = None
        for attempt in range(4):
            try:
                response = await active_client.chat.completions.create(
                    **cast(Any, params)
                )
                return self._parse_response(response, tools)
            except RateLimitError as err:
                last_error = err
                wait = min(2 ** attempt, 20)
                logger.warning(
                    "LLM rate-limited (attempt %d), retrying in %ds",
                    attempt + 1,
                    wait,
                )
                await asyncio.sleep(wait)
                if not is_local:
                    await self._rate_limiter.acquire()
            except APIStatusError as err:
                if err.status_code >= 500:
                    last_error = err
                    wait = min(2 ** attempt, 20)
                    logger.warning(
                        "LLM %d (attempt %d), retrying in %ds",
                        err.status_code,
                        attempt + 1,
                        wait,
                    )
                    await asyncio.sleep(wait)
                    if not is_local:
                        await self._rate_limiter.acquire()
                else:
                    raise
            except Exception as err:
                last_error = err
                # If cloud client failed due to connection error / offline, try local Ollama automatically
                if not is_local:
                    try:
                        logger.info("Cloud LLM unreachable. Attempting fallback to local Ollama...")
                        params["model"] = "qwen2.5-coder:7b"
                        local_resp = await self.local_client.chat.completions.create(**cast(Any, params))
                        return self._parse_response(local_resp, tools)
                    except Exception:
                        pass
                break

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