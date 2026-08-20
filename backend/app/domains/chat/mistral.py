"""
Mistral LLM implementation.
Direct implementation using OpenAI-compatible API for Mistral.
"""

import json
from typing import Any, cast

from openai import AsyncOpenAI

from app.core.config import LLMConfig

# Tool definitions for graph operations
EXTRACT_ENTITIES_TOOL = {
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
                                "description": "The name or identifier of the entity.",
                            },
                            "entity_type": {
                                "type": "string",
                                "description": "The type or category of the entity.",
                            },
                        },
                        "required": ["entity", "entity_type"],
                    },
                    "description": "An array of entities with their types.",
                }
            },
            "required": ["entities"],
        },
    },
}

RELATIONS_TOOL = {
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
                            "source": {
                                "type": "string",
                                "description": "The source entity of the relationship.",
                            },
                            "relationship": {
                                "type": "string",
                                "description": "The relationship between the source and destination entities.",
                            },
                            "destination": {
                                "type": "string",
                                "description": "The destination entity of the relationship.",
                            },
                        },
                        "required": ["source", "relationship", "destination"],
                    },
                }
            },
            "required": ["entities"],
        },
    },
}

DELETE_MEMORY_TOOL = {
    "type": "function",
    "function": {
        "name": "delete_graph_memory",
        "description": "Delete the relationship between two nodes.",
        "parameters": {
            "type": "object",
            "properties": {
                "source": {
                    "type": "string",
                    "description": "The identifier of the source node in the relationship.",
                },
                "relationship": {
                    "type": "string",
                    "description": "The existing relationship between the source and destination nodes that needs to be deleted.",
                },
                "destination": {
                    "type": "string",
                    "description": "The identifier of the destination node in the relationship.",
                },
            },
            "required": ["source", "relationship", "destination"],
        },
    },
}


class MistralLLM:
    """Mistral LLM using OpenAI-compatible API."""

    def __init__(self, config: LLMConfig | None = None) -> None:
        """Initialize Mistral LLM.

        Args:
            config: Optional LLM configuration. Uses defaults if not provided.
        """
        self.config = config or LLMConfig()

        if not self.config.api_key:
            raise ValueError("MISTRAL_API_KEY is required for Mistral LLM")

        self.client = AsyncOpenAI(
            api_key=self.config.api_key, base_url="https://api.mistral.ai/v1"
        )

        self.model = self.config.model

    def _parse_response(
        self, response: Any, tools: list[dict[str, Any]] | None = None
    ) -> str | dict[str, Any]:
        """Parse the LLM response.

        Args:
            response: The raw response from the API.
            tools: Optional list of tools that were provided.

        Returns:
            Parsed response - string content or dict with tool calls.
        """
        if tools:
            processed_response = {
                "content": response.choices[0].message.content,
                "tool_calls": [],
            }

            if response.choices[0].message.tool_calls:
                for tool_call in response.choices[0].message.tool_calls:
                    arguments = tool_call.function.arguments
                    if isinstance(arguments, str):
                        try:
                            arguments = json.loads(arguments)
                        except json.JSONDecodeError:
                            pass

                    processed_response["tool_calls"].append(
                        {
                            "name": tool_call.function.name,
                            "arguments": arguments,
                        }
                    )

            return processed_response
        else:
            content = response.choices[0].message.content
            return content if isinstance(content, str) else ""

    async def generate_response(
        self,
        messages: list[dict[str, str]],
        response_format: dict[str, Any] | None = None,
        tools: list[dict[str, Any]] | None = None,
        tool_choice: str = "auto",
        **kwargs: Any,
    ) -> str | dict[str, Any]:
        """Generate a response from the LLM.

        Args:
            messages: List of message dicts with 'role' and 'content'.
            response_format: Optional response format specification.
            tools: Optional list of tools the model can call.
            tool_choice: Tool choice method ('auto', 'none', or specific tool).
            **kwargs: Additional parameters.

        Returns:
            The generated response - string or dict with tool calls.
        """
        params = {
            "model": self.model,
            "messages": messages,
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
            "top_p": self.config.top_p,
        }

        if response_format:
            params["response_format"] = response_format

        if tools:
            params["tools"] = tools
            params["tool_choice"] = tool_choice

        response = await self.client.chat.completions.create(**cast(Any, params))
        return self._parse_response(response, tools)

    async def chat(self, message: str, system_prompt: str | None = None) -> str:
        """Simple chat method for single message interactions.

        Args:
            message: The user message.
            system_prompt: Optional system prompt.

        Returns:
            The assistant's response.
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": message})

        response = await self.generate_response(messages)
        return response if isinstance(response, str) else response.get("content", "")
