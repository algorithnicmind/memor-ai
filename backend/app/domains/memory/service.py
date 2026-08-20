"""
Core Memory implementation.
Main class that orchestrates embeddings, LLM, vector storage, and graph storage.
"""

import asyncio
import hashlib
import json
import logging
import re
import uuid
from copy import deepcopy
from datetime import datetime
from typing import Any, Optional

from app.core.config import MemoryConfig
from app.infrastructure.embeddings.gemini import GeminiEmbedding
from app.infrastructure.database.kuzu_repo import KuzuGraph
from app.domains.chat.mistral import MistralLLM
from app.domains.memory.cortex_prompts import (
    get_fact_retrieval_messages,
    get_structured_fact_messages,
    get_update_memory_prompt,
)
from app.infrastructure.database.sqlite_repo import SQLiteStorage
from app.infrastructure.database.vector_repo import SearchResult, VectorStore

logger = logging.getLogger(__name__)


def remove_code_blocks(content: str) -> str:
    """Remove enclosing code block markers from a string."""
    pattern = r"^```[a-zA-Z0-9]*\n([\s\S]*?)\n```$"
    match = re.match(pattern, content.strip())
    result = match.group(1).strip() if match else content.strip()
    return re.sub(r"<think>.*?</think>", "", result, flags=re.DOTALL).strip()


def extract_json(text: str) -> str:
    """Extract JSON content from a string."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        return match.group(1)
    return text


def parse_messages(messages: list[dict[str, Any]]) -> str:
    """Parse messages into a formatted string."""
    response = ""
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "system":
            response += f"system: {content}\n"
        elif role == "user":
            response += f"user: {content}\n"
        elif role == "assistant":
            response += f"assistant: {content}\n"
    return response


class Memory:
    """
    Main Memory class that provides a simple interface for memory operations.
    Integrates embeddings (Gemini), LLM (Mistral), vector storage (SQLite),
    and graph storage (Kuzu).
    """

    def __init__(self, config: Optional[MemoryConfig] = None):
        """Initialize Memory.

        Args:
            config: Optional memory configuration. Uses defaults if not provided.
        """
        self.config = config or MemoryConfig()

        # Initialize components
        self.embedder = GeminiEmbedding(self.config.embedder)
        self.llm = MistralLLM(self.config.llm)
        self.history_db = SQLiteStorage(self.config.history)
        self.vector_store = VectorStore(self.config.vector_store)

        # Initialize graph if enabled
        self.graph: Optional[KuzuGraph] = None
        if self.config.graph_store.enabled:
            self.graph = KuzuGraph(
                config=self.config.graph_store,
                embedder_config=self.config.embedder,
                llm_config=self.config.llm,
            )

        logger.info("Memory initialized successfully")

    @classmethod
    def from_dict(cls, config_dict: dict[str, Any]) -> "Memory":
        """Create Memory from a configuration dictionary.

        Args:
            config_dict: Configuration dictionary.

        Returns:
            Memory instance.
        """
        config = MemoryConfig.from_dict(config_dict)
        return cls(config)

    def _build_filters(
        self,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        run_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """Build filters from session IDs.

        Args:
            user_id: Optional user ID.
            agent_id: Optional agent ID.
            run_id: Optional run ID.

        Returns:
            Filter dictionary.

        Raises:
            ValueError: If no session ID is provided.
        """
        filters = {}

        if user_id:
            filters["user_id"] = user_id
        if agent_id:
            filters["agent_id"] = agent_id
        if run_id:
            filters["run_id"] = run_id

        if not filters:
            raise ValueError(
                "At least one of 'user_id', 'agent_id', or 'run_id' must be provided."
            )

        return filters

    async def add(
        self,
        messages: str | dict[str, Any] | list[dict[str, Any]],
        *,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        run_id: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
        infer: bool = True,
    ) -> dict[str, Any]:
        """Add a memory.

        Args:
            messages: The message(s) to store. Can be a string, dict, or list of dicts.
            user_id: Optional user ID.
            agent_id: Optional agent ID.
            run_id: Optional run ID.
            metadata: Optional additional metadata.
            infer: Whether to infer memories from the messages.

        Returns:
            Dictionary with results.
        """
        filters = self._build_filters(user_id, agent_id, run_id)

        # Normalize messages
        if isinstance(messages, str):
            messages = [{"role": "user", "content": messages}]
        elif isinstance(messages, dict):
            messages = [messages]
        elif not isinstance(messages, list):
            raise ValueError("messages must be str, dict, or list[dict]")

        # Build metadata
        base_metadata = deepcopy(metadata) if metadata else {}
        base_metadata.update(filters)

        if not infer:
            # Direct storage without fact extraction
            return await self._add_direct(messages, base_metadata)

        # Infer facts and store
        return await self._add_with_inference(messages, base_metadata, filters)

    async def add_structured(
        self,
        messages: str | dict[str, Any] | list[dict[str, Any]],
        *,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        run_id: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """Add memory with structured fact extraction.

        This method extracts facts with type classification (simple, decision,
        preference, plan) and stores additional context for decisions.
        Also handles UPDATE and DELETE of existing memories when new facts
        contradict or update them.

        Args:
            messages: The message(s) to store. Can be a string, dict, or list of dicts.
            user_id: Optional user ID.
            agent_id: Optional agent ID.
            run_id: Optional run ID.
            metadata: Optional additional metadata.

        Returns:
            Dictionary with results including structured facts.
        """
        filters = self._build_filters(user_id, agent_id, run_id)

        # Normalize messages
        if isinstance(messages, str):
            messages = [{"role": "user", "content": messages}]
        elif isinstance(messages, dict):
            messages = [messages]
        elif not isinstance(messages, list):
            raise ValueError("messages must be str, dict, or list[dict]")

        # Build metadata
        base_metadata = deepcopy(metadata) if metadata else {}
        base_metadata.update(filters)

        # Parse messages
        parsed_messages = parse_messages(messages)

        # Get structured fact extraction prompts
        system_prompt, user_prompt = get_structured_fact_messages(parsed_messages)

        # Extract structured facts using LLM
        response = await self.llm.generate_response(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )

        # Add to graph if enabled
        if self.graph:
            try:
                await self.graph.add(parsed_messages, filters)
            except Exception as e:
                logger.error(f"Error adding to graph: {e}")

        # Parse structured facts
        try:
            response_text = (
                response
                if isinstance(response, str)
                else str(response.get("content", ""))
            )
            response_text = remove_code_blocks(response_text)
            if not response_text.strip():
                structured_facts = []
            else:
                try:
                    parsed = json.loads(response_text)
                    structured_facts = parsed.get("structured_facts", [])
                except json.JSONDecodeError:
                    extracted = extract_json(response_text)
                    parsed = json.loads(extracted)
                    structured_facts = parsed.get("structured_facts", [])
        except Exception as e:
            logger.error(f"Error parsing structured facts: {e}")
            structured_facts = []

        if not structured_facts:
            logger.debug("No structured facts extracted")
            return {"results": []}

        # Extract content from structured facts for similarity search
        new_facts = [f.get("content", "") for f in structured_facts if f.get("content")]

        if not new_facts:
            return {"results": []}

        # Search for existing similar memories
        existing_memories = []
        new_embeddings = {}

        async def process_fact(fact_content: str) -> list[dict[str, str]]:
            embeddings = await self.embedder.embed(fact_content, "add")
            new_embeddings[fact_content] = embeddings

            results = await self.vector_store.search(
                query=fact_content,
                vectors=embeddings,
                limit=5,
                filters=filters,
            )

            return [
                {"id": mem.id, "text": mem.payload.get("data", "")} for mem in results
            ]

        # Search for each fact in parallel
        search_tasks = [process_fact(f) for f in new_facts]
        search_results = await asyncio.gather(*search_tasks)

        for result_group in search_results:
            existing_memories.extend(result_group)

        # Deduplicate existing memories
        unique_memories = {}
        for mem in existing_memories:
            unique_memories[mem["id"]] = mem
        existing_memories = list(unique_memories.values())

        # Create temp ID mapping for LLM
        temp_id_map = {}
        for idx, mem in enumerate(existing_memories):
            temp_id_map[str(idx)] = mem["id"]
            existing_memories[idx]["id"] = str(idx)

        # Get memory update actions from LLM
        if existing_memories:
            update_prompt = get_update_memory_prompt(
                existing_memories,
                new_facts,
                self.config.custom_update_memory_prompt,
            )

            try:
                update_response = await self.llm.generate_response(
                    messages=[{"role": "user", "content": update_prompt}],
                    response_format={"type": "json_object"},
                )
            except Exception as e:
                logger.error(f"Error getting memory actions: {e}")
                update_response = ""

            try:
                update_text = (
                    update_response
                    if isinstance(update_response, str)
                    else str(update_response.get("content", ""))
                )
                if not update_text or not update_text.strip():
                    memory_actions = {}
                else:
                    update_text = remove_code_blocks(update_text)
                    memory_actions = json.loads(update_text)
            except Exception as e:
                logger.error(f"Invalid JSON response: {e}")
                memory_actions = {}
        else:
            # No existing memories, just add all
            memory_actions = {
                "memory": [
                    {"id": str(i), "text": f, "event": "ADD"}
                    for i, f in enumerate(new_facts)
                ]
            }

        # Build a map of fact content to structured fact data
        fact_data_map = {f.get("content", ""): f for f in structured_facts}

        # Process memory actions
        returned_memories = []

        for action in memory_actions.get("memory", []):
            try:
                text = action.get("text")
                if not text:
                    continue

                event = action.get("event")

                # Get structured data for this fact if available
                struct_data = fact_data_map.get(text, {})

                # Build enhanced metadata
                fact_metadata = deepcopy(base_metadata)
                fact_metadata["memory_type"] = struct_data.get("memory_type", "simple")
                fact_metadata["category"] = struct_data.get("category")
                fact_metadata["importance"] = struct_data.get("importance", "normal")

                # Add decision-specific fields if present
                if struct_data.get("memory_type") == "decision":
                    decision_context = {
                        "goal": struct_data.get("goal"),
                        "constraints": struct_data.get("constraints", []),
                        "alternatives": struct_data.get("alternatives", []),
                        "final_choice": struct_data.get("final_choice"),
                        "reasoning": struct_data.get("reasoning"),
                        "emotional_state": struct_data.get("emotional_state"),
                    }
                    fact_metadata["decision_context"] = decision_context

                if event == "ADD":
                    mem_id = await self._create_memory(
                        text,
                        deepcopy(fact_metadata),
                        existing_embeddings=new_embeddings,
                    )
                    result = {
                        "id": mem_id,
                        "memory": text,
                        "event": "ADD",
                        "memory_type": struct_data.get("memory_type", "simple"),
                    }
                    if struct_data.get("memory_type") == "decision":
                        result["decision_context"] = fact_metadata.get(
                            "decision_context"
                        )
                    returned_memories.append(result)

                elif event == "UPDATE":
                    real_id = temp_id_map.get(action.get("id"))
                    if real_id:
                        await self._update_memory(
                            real_id,
                            text,
                            deepcopy(fact_metadata),
                            existing_embeddings=new_embeddings,
                        )
                        result = {
                            "id": real_id,
                            "memory": text,
                            "event": "UPDATE",
                            "previous_memory": action.get("old_memory"),
                            "memory_type": struct_data.get("memory_type", "simple"),
                        }
                        if struct_data.get("memory_type") == "decision":
                            result["decision_context"] = fact_metadata.get(
                                "decision_context"
                            )
                        returned_memories.append(result)

                elif event == "DELETE":
                    real_id = temp_id_map.get(action.get("id"))
                    if real_id:
                        await self._delete_memory(real_id)
                        returned_memories.append(
                            {
                                "id": real_id,
                                "memory": text,
                                "event": "DELETE",
                            }
                        )

            except Exception as e:
                logger.error(f"Error processing action: {action}, Error: {e}")

        return {"results": returned_memories}

    async def add_decision(
        self,
        goal: str,
        *,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        run_id: Optional[str] = None,
        constraints: Optional[list[str]] = None,
        alternatives: Optional[list[str]] = None,
        final_choice: Optional[str] = None,
        reasoning: Optional[str] = None,
        emotional_state: Optional[str] = None,
        category: Optional[str] = None,
        privacy_level: str = "private",
        confidence: Optional[float] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """Add a structured decision memory directly.

        Use this method to explicitly record a decision with full context.

        Args:
            goal: What the user was trying to achieve.
            user_id: Optional user ID.
            agent_id: Optional agent ID.
            run_id: Optional run ID.
            constraints: Limitations or requirements (budget, time, etc.).
            alternatives: Options that were considered.
            final_choice: The decision made.
            reasoning: Why this choice was made.
            emotional_state: How the user feels about the decision.
            category: Domain (career, health, finance, personal, etc.).
            privacy_level: "private", "shared", or "public".
            confidence: Confidence level 0.0 to 1.0.
            metadata: Optional additional metadata.

        Returns:
            Dictionary with the stored decision memory.
        """
        filters = self._build_filters(user_id, agent_id, run_id)

        # Generate decision ID
        decision_id = f"decision_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
        timestamp = datetime.utcnow().isoformat()

        # Build decision memory content
        content_parts = [f"Decision: {goal}"]
        if final_choice:
            content_parts.append(f"Choice: {final_choice}")
        if reasoning:
            content_parts.append(f"Reasoning: {reasoning}")
        content = " | ".join(content_parts)

        # Build metadata
        fact_metadata = deepcopy(metadata) if metadata else {}
        fact_metadata.update(filters)
        fact_metadata["memory_type"] = "decision"
        fact_metadata["category"] = category
        fact_metadata["importance"] = "high"  # Decisions are typically important
        fact_metadata["privacy_level"] = privacy_level

        # Decision context
        decision_context = {
            "decision_id": decision_id,
            "timestamp": timestamp,
            "goal": goal,
            "constraints": constraints or [],
            "alternatives": alternatives or [],
            "final_choice": final_choice,
            "reasoning": reasoning,
            "emotional_state": emotional_state,
            "confidence": confidence,
        }
        fact_metadata["decision_context"] = decision_context

        # Create memory
        mem_id = await self._create_memory(content, fact_metadata)

        # Add to graph if enabled (create decision-specific relationships)
        if self.graph:
            try:
                # Build decision graph representation
                decision_text = f"User made a decision about {goal}. "
                if final_choice:
                    decision_text += f"Chose {final_choice}. "
                if reasoning:
                    decision_text += f"Because {reasoning}."

                await self.graph.add(decision_text, filters)
            except Exception as e:
                logger.error(f"Error adding decision to graph: {e}")

        return {
            "results": [
                {
                    "id": mem_id,
                    "memory": content,
                    "event": "ADD",
                    "memory_type": "decision",
                    "decision_context": decision_context,
                }
            ]
        }

    async def _add_direct(
        self, messages: list[dict[str, Any]], metadata: dict[str, Any]
    ) -> dict[str, Any]:
        """Add messages directly without inference.

        Args:
            messages: List of message dicts.
            metadata: Metadata to store with each memory.

        Returns:
            Dictionary with results.
        """
        returned_memories = []

        for msg in messages:
            if not isinstance(msg, dict) or "content" not in msg:
                continue

            if msg.get("role") == "system":
                continue

            content = msg["content"]
            per_msg_meta = deepcopy(metadata)
            per_msg_meta["role"] = msg.get("role", "user")

            # Create memory
            mem_id = await self._create_memory(content, per_msg_meta)

            returned_memories.append(
                {
                    "id": mem_id,
                    "memory": content,
                    "event": "ADD",
                }
            )

        return {"results": returned_memories}

    async def _add_with_inference(
        self,
        messages: list[dict[str, Any]],
        metadata: dict[str, Any],
        filters: dict[str, Any],
    ) -> dict[str, Any]:
        """Add messages with fact extraction and inference.

        Args:
            messages: List of message dicts.
            metadata: Metadata to store with each memory.
            filters: Filters for searching existing memories.

        Returns:
            Dictionary with results.
        """
        # Parse messages
        parsed_messages = parse_messages(messages)

        # Get fact retrieval prompts
        if self.config.custom_fact_extraction_prompt:
            system_prompt = self.config.custom_fact_extraction_prompt
            user_prompt = f"Input:\n{parsed_messages}"
        else:
            has_assistant = any(msg.get("role") == "assistant" for msg in messages)
            is_agent_memory = metadata.get("agent_id") is not None and has_assistant
            system_prompt, user_prompt = get_fact_retrieval_messages(
                parsed_messages, is_agent_memory
            )

        # Extract facts using LLM
        response = await self.llm.generate_response(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )

        # Add to graph if enabled
        if self.graph:
            try:
                await self.graph.add(parsed_messages, filters)
            except Exception as e:
                logger.error(f"Error adding to graph: {e}")

        # Parse extracted facts
        try:
            response_text = (
                response
                if isinstance(response, str)
                else str(response.get("content", ""))
            )
            response_text = remove_code_blocks(response_text)
            if not response_text.strip():
                new_facts = []
            else:
                try:
                    new_facts = json.loads(response_text)["facts"]
                except json.JSONDecodeError:
                    extracted = extract_json(response_text)
                    new_facts = json.loads(extracted)["facts"]
        except Exception as e:
            logger.error(f"Error parsing facts: {e}")
            new_facts = []

        if not new_facts:
            logger.debug("No new facts extracted")
            return {"results": []}

        # Search for existing memories
        existing_memories = []
        new_embeddings = {}

        async def process_fact(fact: str) -> list[dict[str, str]]:
            embeddings = await self.embedder.embed(fact, "add")
            new_embeddings[fact] = embeddings

            results = await self.vector_store.search(
                query=fact,
                vectors=embeddings,
                limit=5,
                filters=filters,
            )

            return [
                {"id": mem.id, "text": mem.payload.get("data", "")} for mem in results
            ]

        # Search for each fact in parallel
        search_tasks = [process_fact(fact) for fact in new_facts]
        search_results = await asyncio.gather(*search_tasks)

        for result_group in search_results:
            existing_memories.extend(result_group)

        # Deduplicate
        unique_memories = {}
        for mem in existing_memories:
            unique_memories[mem["id"]] = mem
        existing_memories = list(unique_memories.values())

        logger.info(f"Found {len(existing_memories)} existing memories")

        # Create temp ID mapping
        temp_id_map = {}
        for idx, mem in enumerate(existing_memories):
            temp_id_map[str(idx)] = mem["id"]
            existing_memories[idx]["id"] = str(idx)

        # Get memory update actions
        if new_facts:
            update_prompt = get_update_memory_prompt(
                existing_memories,
                new_facts,
                self.config.custom_update_memory_prompt,
            )

            try:
                response = await self.llm.generate_response(
                    messages=[{"role": "user", "content": update_prompt}],
                    response_format={"type": "json_object"},
                )
            except Exception as e:
                logger.error(f"Error getting memory actions: {e}")
                response = ""

            try:
                response_text = (
                    response
                    if isinstance(response, str)
                    else str(response.get("content", ""))
                )
                if not response_text or not response_text.strip():
                    memory_actions = {}
                else:
                    response_text = remove_code_blocks(response_text)
                    memory_actions = json.loads(response_text)
            except Exception as e:
                logger.error(f"Invalid JSON response: {e}")
                memory_actions = {}
        else:
            memory_actions = {}

        # Process memory actions
        returned_memories = []

        for action in memory_actions.get("memory", []):
            try:
                text = action.get("text")
                if not text:
                    continue

                event = action.get("event")

                if event == "ADD":
                    mem_id = await self._create_memory(
                        text,
                        deepcopy(metadata),
                        existing_embeddings=new_embeddings,
                    )
                    returned_memories.append(
                        {
                            "id": mem_id,
                            "memory": text,
                            "event": "ADD",
                        }
                    )

                elif event == "UPDATE":
                    real_id = temp_id_map.get(action.get("id"))
                    if real_id:
                        await self._update_memory(
                            real_id,
                            text,
                            deepcopy(metadata),
                            existing_embeddings=new_embeddings,
                        )
                        returned_memories.append(
                            {
                                "id": real_id,
                                "memory": text,
                                "event": "UPDATE",
                                "previous_memory": action.get("old_memory"),
                            }
                        )

                elif event == "DELETE":
                    real_id = temp_id_map.get(action.get("id"))
                    if real_id:
                        await self._delete_memory(real_id)
                        returned_memories.append(
                            {
                                "id": real_id,
                                "memory": text,
                                "event": "DELETE",
                            }
                        )

            except Exception as e:
                logger.error(f"Error processing action: {action}, Error: {e}")

        return {"results": returned_memories}

    async def _create_memory(
        self,
        data: str,
        metadata: dict[str, Any],
        existing_embeddings: Optional[dict[str, list[float]]] = None,
    ) -> str:
        """Create a new memory.

        Args:
            data: The memory content.
            metadata: Metadata for the memory.
            existing_embeddings: Optional pre-computed embeddings.

        Returns:
            The memory ID (existing if duplicate, new if created).
        """
        logger.debug(f"Creating memory: {data[:50]}...")

        # Compute hash for deduplication
        content_hash = hashlib.md5(data.encode()).hexdigest()

        # Check for existing memory with same hash (duplicate check)
        filters = {}
        for key in ["user_id", "agent_id", "run_id"]:
            if key in metadata:
                filters[key] = metadata[key]

        if filters:
            existing_memories, _ = await self.vector_store.list(
                filters=filters, limit=100
            )
            for mem in existing_memories:
                if mem.payload.get("hash") == content_hash:
                    logger.debug(f"Duplicate found, returning existing: {mem.id}")
                    return (
                        mem.id
                    )  # Return existing memory ID instead of creating duplicate

        # Get or compute embeddings
        if existing_embeddings and data in existing_embeddings:
            embeddings = existing_embeddings[data]
        else:
            embeddings = await self.embedder.embed(data, "add")

        # Create memory record
        memory_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        metadata["data"] = data
        metadata["hash"] = content_hash
        metadata["created_at"] = now

        # Store in vector store
        await self.vector_store.insert(
            vectors=[embeddings],
            ids=[memory_id],
            payloads=[metadata],
        )

        # Add to history
        await self.history_db.add_history(
            memory_id=memory_id,
            event="ADD",
            new_memory=data,
            created_at=now,
        )

        logger.debug(f"Created memory: {memory_id}")
        return memory_id

    async def _update_memory(
        self,
        memory_id: str,
        data: str,
        metadata: dict[str, Any],
        existing_embeddings: Optional[dict[str, list[float]]] = None,
    ) -> None:
        """Update an existing memory.

        Args:
            memory_id: The memory ID to update.
            data: The new memory content.
            metadata: Updated metadata.
            existing_embeddings: Optional pre-computed embeddings.
        """
        logger.debug(f"Updating memory: {memory_id}")

        # Get existing memory
        existing = await self.vector_store.get(memory_id)
        if not existing:
            logger.warning(f"Memory not found: {memory_id}")
            return

        old_data = existing.payload.get("data", "")
        old_hash = existing.payload.get("hash", "")
        new_hash = hashlib.md5(data.encode()).hexdigest()

        # Skip update if content is exactly the same (no-op update)
        if old_hash == new_hash:
            logger.debug(f"Skipping update - content unchanged: {memory_id}")
            return

        # Get or compute embeddings
        if existing_embeddings and data in existing_embeddings:
            embeddings = existing_embeddings[data]
        else:
            embeddings = await self.embedder.embed(data, "update")

        # Update metadata - but PRESERVE important original values
        now = datetime.utcnow().isoformat()
        new_payload = deepcopy(existing.payload)

        # Preserve original memory_type if the new one is "simple" (less specific)
        # Only upgrade memory_type, never downgrade
        old_memory_type = existing.payload.get("memory_type", "simple")
        new_memory_type = metadata.get("memory_type", "simple")

        # Type priority: decision > preference > plan > simple
        type_priority = {"decision": 4, "preference": 3, "plan": 2, "simple": 1}
        if type_priority.get(new_memory_type, 0) <= type_priority.get(
            old_memory_type, 0
        ):
            # New type is same or less specific - preserve old type
            metadata["memory_type"] = old_memory_type

            # Also preserve decision_context if we're keeping the decision type
            if old_memory_type == "decision" and existing.payload.get(
                "decision_context"
            ):
                # Merge decision contexts - keep old values, add new ones
                old_context = existing.payload.get("decision_context", {})
                new_context = metadata.get("decision_context", {})
                if new_context:
                    # Only update fields that have meaningful new values
                    for key, value in new_context.items():
                        if value and (
                            not old_context.get(key) or value != old_context.get(key)
                        ):
                            old_context[key] = value
                metadata["decision_context"] = old_context
            elif old_memory_type == "decision":
                metadata["decision_context"] = existing.payload.get("decision_context")

        # Preserve category if new one is None
        if metadata.get("category") is None and existing.payload.get("category"):
            metadata["category"] = existing.payload.get("category")

        # Preserve importance if new one is "normal" and old one is higher
        importance_priority = {"critical": 4, "high": 3, "normal": 2, "low": 1}
        old_importance = existing.payload.get("importance", "normal")
        new_importance = metadata.get("importance", "normal")
        if importance_priority.get(new_importance, 0) < importance_priority.get(
            old_importance, 0
        ):
            metadata["importance"] = old_importance

        new_payload.update(metadata)
        new_payload["data"] = data
        new_payload["hash"] = new_hash
        new_payload["updated_at"] = now

        # Add to inline changelog (tracks previous values) - only if content changed
        changelog = new_payload.get("changelog", [])
        changelog.append(
            {
                "previous_value": old_data,
                "changed_to": data,
                "changed_at": now,
            }
        )
        new_payload["changelog"] = changelog

        # Update in vector store
        await self.vector_store.update(
            vector_id=memory_id,
            vector=embeddings,
            payload=new_payload,
        )

        # Add to history (external tracking)
        await self.history_db.add_history(
            memory_id=memory_id,
            event="UPDATE",
            old_memory=old_data,
            new_memory=data,
            updated_at=now,
        )

    async def _delete_memory(self, memory_id: str) -> None:
        """Delete a memory.

        Args:
            memory_id: The memory ID to delete.
        """
        logger.debug(f"Deleting memory: {memory_id}")

        # Get existing memory
        existing = await self.vector_store.get(memory_id)
        if existing:
            old_data = existing.payload.get("data", "")

            # Add to history
            await self.history_db.add_history(
                memory_id=memory_id,
                event="DELETE",
                old_memory=old_data,
                updated_at=datetime.utcnow().isoformat(),
            )

        # Delete from vector store
        await self.vector_store.delete(memory_id)

        # Mark history as deleted
        await self.history_db.delete_history(memory_id)

    async def get(self, memory_id: str) -> Optional[dict[str, Any]]:
        """Get a memory by ID.

        Args:
            memory_id: The memory ID.

        Returns:
            Memory dictionary or None if not found.
        """
        memory = await self.vector_store.get(memory_id)
        if not memory:
            return None

        return self._format_memory(memory)

    async def get_all(
        self,
        *,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        run_id: Optional[str] = None,
        limit: int = 100,
    ) -> dict[str, list[dict[str, Any]]]:
        """Get all memories.

        Args:
            user_id: Optional user ID filter.
            agent_id: Optional agent ID filter.
            run_id: Optional run ID filter.
            limit: Maximum number of results.

        Returns:
            Dictionary with results list.
        """
        filters = self._build_filters(user_id, agent_id, run_id)

        memories, _ = await self.vector_store.list(filters=filters, limit=limit)

        return {"results": [self._format_memory(mem) for mem in memories]}

    async def search(
        self,
        query: str,
        *,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        run_id: Optional[str] = None,
        limit: int = 100,
        threshold: float = 0.5,  # Default threshold to filter irrelevant results
    ) -> dict[str, Any]:
        """Search for memories.

        Args:
            query: The search query.
            user_id: Optional user ID filter.
            agent_id: Optional agent ID filter.
            run_id: Optional run ID filter.
            limit: Maximum number of results.
            threshold: Minimum score threshold (0-1). Defaults to 0.5.

        Returns:
            Dictionary with results and relations.
        """
        filters = self._build_filters(user_id, agent_id, run_id)

        # Get embeddings
        embeddings = await self.embedder.embed(query, "search")

        # Search vector store
        memories = await self.vector_store.search(
            query=query,
            vectors=embeddings,
            limit=limit,
            filters=filters,
        )

        # Apply threshold to filter out irrelevant memories
        memories = [m for m in memories if m.score >= threshold]

        results = [self._format_memory(mem, include_score=True) for mem in memories]

        # Search graph if enabled
        relations = []
        if self.graph:
            try:
                relations = await self.graph.search(query, filters, limit)
            except Exception as e:
                logger.error(f"Error searching graph: {e}")

        return {
            "results": results,
            "relations": relations,
        }

    async def update(self, memory_id: str, data: str) -> dict[str, str]:
        """Update a memory.

        Args:
            memory_id: The memory ID to update.
            data: The new memory content.

        Returns:
            Success message.
        """
        embeddings = await self.embedder.embed(data, "update")
        await self._update_memory(
            memory_id,
            data,
            {},
            existing_embeddings={data: embeddings},
        )
        return {"message": "Memory updated successfully!"}

    async def delete(self, memory_id: str) -> dict[str, str]:
        """Delete a memory.

        Args:
            memory_id: The memory ID to delete.

        Returns:
            Success message.
        """
        await self._delete_memory(memory_id)
        return {"message": "Memory deleted successfully!"}

    async def delete_all(
        self,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        run_id: Optional[str] = None,
    ) -> dict[str, str]:
        """Delete all memories matching filters.

        Args:
            user_id: Optional user ID filter.
            agent_id: Optional agent ID filter.
            run_id: Optional run ID filter.

        Returns:
            Success message.
        """
        filters = self._build_filters(user_id, agent_id, run_id)

        # Get all memories
        memories, _ = await self.vector_store.list(filters=filters)

        # Delete each memory
        for mem in memories:
            await self._delete_memory(mem.id)

        # Delete from graph if enabled
        if self.graph:
            try:
                await self.graph.delete_all(filters)
            except Exception as e:
                logger.error(f"Error deleting from graph: {e}")

        logger.info(f"Deleted {len(memories)} memories")
        return {"message": "Memories deleted successfully!"}

    async def history(self, memory_id: str) -> list[dict[str, Any]]:
        """Get history for a memory.

        Args:
            memory_id: The memory ID.

        Returns:
            List of history records.
        """
        return await self.history_db.get_history(memory_id)

    async def reset(self) -> dict[str, str]:
        """Reset all storage (vectors, history, graph).

        Returns:
            Success message.
        """
        await self.vector_store.reset()
        await self.history_db.reset()

        if self.graph:
            self.graph.reset()

        logger.info("Memory reset complete")
        return {"message": "Memory reset successfully!"}

    async def close(self) -> None:
        """Close all connections."""
        await self.vector_store.close()
        await self.history_db.close()
        logger.info("Memory connections closed")

    def _format_memory(
        self, memory: SearchResult, include_score: bool = False
    ) -> dict[str, Any]:
        """Format a memory for output.

        Args:
            memory: The memory search result.
            include_score: Whether to include the score.

        Returns:
            Formatted memory dictionary.
        """
        result = {
            "id": memory.id,
            "memory": memory.payload.get("data", ""),
            "hash": memory.payload.get("hash"),
            "created_at": memory.payload.get("created_at"),
            "updated_at": memory.payload.get("updated_at"),
        }

        if include_score:
            result["score"] = memory.score

        # Add session IDs
        for key in ["user_id", "agent_id", "run_id"]:
            if key in memory.payload:
                result[key] = memory.payload[key]

        # Add structured memory fields
        if "memory_type" in memory.payload:
            result["memory_type"] = memory.payload["memory_type"]
        if "category" in memory.payload:
            result["category"] = memory.payload["category"]
        if "importance" in memory.payload:
            result["importance"] = memory.payload["importance"]

        # Add decision context if present
        if "decision_context" in memory.payload:
            result["decision_context"] = memory.payload["decision_context"]

        # Add changelog if present (tracks previous values)
        if "changelog" in memory.payload and memory.payload["changelog"]:
            result["changelog"] = memory.payload["changelog"]

        # Add extra metadata (excluding known fields)
        excluded_keys = {
            "data",
            "hash",
            "created_at",
            "updated_at",
            "user_id",
            "agent_id",
            "run_id",
            "role",
            "memory_type",
            "category",
            "importance",
            "decision_context",
            "privacy_level",
            "changelog",
        }
        extra_metadata = {
            k: v for k, v in memory.payload.items() if k not in excluded_keys
        }
        if extra_metadata:
            result["metadata"] = extra_metadata

        return result
