"""Memory service.

Single public class (`Memory`) that orchestrates:
  - OpenAI-SDK-compatible embeddings + chat
  - Tortoise-backed vector store + history store
  - Kuzu graph for entity/relation structure

Internal flow regroups as `_extract_facts → _find_collisions →
_resolve_actions → _apply_actions → _write_memory`, with the typed
decision pipeline sitting on top.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
import uuid
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from app.core.config import AppConfig, get_config_from_env
from app.domains.chat.openai_compat import OpenAICompatibleLLM
from app.domains.memory.cortex_prompts import (
    get_fact_retrieval_messages,
    get_structured_fact_messages,
    get_update_memory_prompt,
)
from app.infrastructure.database.kuzu_repo import KuzuGraph
from app.infrastructure.database.sqlite_repo import HistoryStore
from app.infrastructure.database.vector_repo import SearchResult, VectorStore
from app.infrastructure.embeddings.openai_compat import OpenAICompatibleEmbedder

logger = logging.getLogger(__name__)


# ---- helpers -------------------------------------------------------------


def strip_code_fences(content: str) -> str:
    """Strip ``` fences + <think> blocks from a string."""
    pattern = r"^```[a-zA-Z0-9]*\n([\s\S]*?)\n```$"
    match = re.match(pattern, content.strip())
    body = match.group(1).strip() if match else content.strip()
    return re.sub(r"<think>.*?</think>", "", body, flags=re.DOTALL).strip()


def recover_json(text: str) -> str:
    """Pull JSON out of a (possibly fenced) string."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    return match.group(1) if match else text


def format_chat(messages: list[dict[str, Any]]) -> str:
    """Render chat messages as a transcript string."""
    out: list[str] = []
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role in ("system", "user", "assistant"):
            out.append(f"{role}: {content}")
    return "\n".join(out) + "\n"


_TYPE_PRIORITY = {"decision": 4, "preference": 3, "plan": 2, "simple": 1}
_IMPORTANCE_PRIORITY = {"critical": 4, "high": 3, "normal": 2, "low": 1}


def _now() -> datetime:
    return datetime.now(UTC)


def _now_iso() -> str:
    return _now().isoformat()


# ---- public class --------------------------------------------------------


class Memory:
    """Memory engine — vector + history + graph + chat."""

    def __init__(self, config: AppConfig | None = None) -> None:
        self.config = config or get_config_from_env()
        provider = self.config.provider
        self.embedder = OpenAICompatibleEmbedder(provider)
        self.llm = OpenAICompatibleLLM(provider)
        self.vector_store = VectorStore(self.config.vector_store)
        self.history_db = HistoryStore(self.config.history)
        self.graph: KuzuGraph | None = None
        if self.config.graph_store.enabled:
            self.graph = KuzuGraph(
                config=self.config.graph_store,
                provider_config=provider,
            )
        logger.info("Memory engine ready")

    # -- public surface ----------------------------------------------------

    def _build_filters(
        self,
        user_id: str | None = None,
        agent_id: str | None = None,
        run_id: str | None = None,
    ) -> dict[str, Any]:
        filters: dict[str, Any] = {}
        if user_id:
            filters["user_id"] = user_id
        if agent_id:
            filters["agent_id"] = agent_id
        if run_id:
            filters["run_id"] = run_id
        if not filters:
            raise ValueError(
                "At least one of user_id, agent_id, or run_id must be provided"
            )
        return filters

    async def add(
        self,
        messages: str | dict[str, Any] | list[dict[str, Any]],
        *,
        user_id: str | None = None,
        agent_id: str | None = None,
        run_id: str | None = None,
        metadata: dict[str, Any] | None = None,
        infer: bool = True,
    ) -> dict[str, Any]:
        filters = self._build_filters(user_id, agent_id, run_id)
        normalized = self._coerce_messages(messages)
        base_meta = deepcopy(metadata) if metadata else {}
        base_meta.update(filters)
        if not infer:
            return await self._add_direct(normalized, base_meta)
        return await self._add_with_inference(normalized, base_meta, filters)

    async def add_structured(
        self,
        messages: str | dict[str, Any] | list[dict[str, Any]],
        *,
        user_id: str | None = None,
        agent_id: str | None = None,
        run_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        filters = self._build_filters(user_id, agent_id, run_id)
        normalized = self._coerce_messages(messages)
        base_meta = deepcopy(metadata) if metadata else {}
        base_meta.update(filters)

        transcript = format_chat(normalized)
        structured_facts = await self._extract_structured_facts(transcript, filters)
        if not structured_facts:
            return {"results": []}

        new_facts = [f["content"] for f in structured_facts if f.get("content")]
        if not new_facts:
            return {"results": []}

        existing, new_embeddings = await self._find_collisions(new_facts, filters)
        actions = await self._resolve_actions(
            existing=existing, new_facts=new_facts
        )
        return await self._apply_actions(
            actions=actions,
            existing=existing,
            new_facts=new_facts,
            structured_facts=structured_facts,
            base_meta=base_meta,
            new_embeddings=new_embeddings,
        )

    async def add_decision(
        self,
        goal: str,
        *,
        user_id: str | None = None,
        agent_id: str | None = None,
        run_id: str | None = None,
        constraints: list[str] | None = None,
        alternatives: list[str] | None = None,
        final_choice: str | None = None,
        reasoning: str | None = None,
        emotional_state: str | None = None,
        category: str | None = None,
        privacy_level: str = "private",
        confidence: float | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        filters = self._build_filters(user_id, agent_id, run_id)
        decision_id = (
            f"decision_{_now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        )

        parts = [f"Decision: {goal}"]
        if final_choice:
            parts.append(f"Choice: {final_choice}")
        if reasoning:
            parts.append(f"Reasoning: {reasoning}")
        content = " | ".join(parts)

        meta = deepcopy(metadata) if metadata else {}
        meta.update(filters)
        meta["memory_type"] = "decision"
        meta["category"] = category
        meta["importance"] = "high"
        meta["privacy_level"] = privacy_level
        meta["decision_context"] = {
            "decision_id": decision_id,
            "timestamp": _now_iso(),
            "goal": goal,
            "constraints": constraints or [],
            "alternatives": alternatives or [],
            "final_choice": final_choice,
            "reasoning": reasoning,
            "emotional_state": emotional_state,
            "confidence": confidence,
        }
        await self._write_memory(content, meta)

        if self.graph:
            try:
                graph_text = f"User made a decision about {goal}. "
                if final_choice:
                    graph_text += f"Chose {final_choice}. "
                if reasoning:
                    graph_text += f"Because {reasoning}."
                await self.graph.add(graph_text, filters)
            except Exception:
                logger.exception("Graph ingest failed for decision")

        return {
            "results": [
                {
                    "id": decision_id,
                    "memory": content,
                    "event": "ADD",
                    "memory_type": "decision",
                    "decision_context": meta["decision_context"],
                }
            ]
        }

    async def get(self, memory_id: str) -> dict[str, Any] | None:
        memory = await self.vector_store.get(memory_id)
        return _format_memory(memory) if memory else None

    async def get_all(
        self,
        *,
        user_id: str | None = None,
        agent_id: str | None = None,
        run_id: str | None = None,
        limit: int = 100,
    ) -> dict[str, list[dict[str, Any]]]:
        filters = self._build_filters(user_id, agent_id, run_id)
        memories, _ = await self.vector_store.list(filters=filters, limit=limit)
        return {"results": [_format_memory(m) for m in memories]}

    async def search(
        self,
        query: str,
        *,
        user_id: str | None = None,
        agent_id: str | None = None,
        run_id: str | None = None,
        limit: int = 100,
        threshold: float = 0.5,
    ) -> dict[str, Any]:
        filters = self._build_filters(user_id, agent_id, run_id)
        embedding = await self.embedder.embed(query, "query")
        matches = await self.vector_store.search(
            query=query, vectors=embedding, limit=limit, filters=filters
        )
        results = [
            _format_memory(m, include_score=True)
            for m in matches
            if m.score >= threshold
        ]
        relations: list[dict[str, str]] = []
        if self.graph:
            try:
                relations = await self.graph.search(query, filters, limit)
            except Exception:
                logger.exception("Graph search failed")
        return {"results": results, "relations": relations}

    async def update(self, memory_id: str, data: str) -> dict[str, str]:
        embedding = await self.embedder.embed(data, "update")
        await self._write_update(
            memory_id, data, {}, existing_embeddings={data: embedding}
        )
        return {"message": "Memory updated successfully!"}

    async def delete(self, memory_id: str) -> dict[str, str]:
        await self._delete_memory(memory_id)
        return {"message": "Memory deleted successfully!"}

    async def delete_all(
        self,
        user_id: str | None = None,
        agent_id: str | None = None,
        run_id: str | None = None,
    ) -> dict[str, str]:
        filters = self._build_filters(user_id, agent_id, run_id)
        memories, _ = await self.vector_store.list(filters=filters)
        for mem in memories:
            await self._delete_memory(mem.id)
        if self.graph:
            try:
                await self.graph.delete_all(filters)
            except Exception:
                logger.exception("Graph delete_all failed")
        return {"message": "Memories deleted successfully!"}

    async def history(self, memory_id: str) -> list[dict[str, Any]]:
        return await self.history_db.get_history(memory_id)

    async def reset(self) -> dict[str, str]:
        await self.vector_store.reset()
        await self.history_db.reset()
        if self.graph:
            self.graph.reset()
        return {"message": "Memory reset successfully!"}

    async def close(self) -> None:
        await self.vector_store.close()
        await self.history_db.close()

    # -- internal pipeline ------------------------------------------------

    @staticmethod
    def _coerce_messages(
        messages: str | dict[str, Any] | list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        if isinstance(messages, str):
            return [{"role": "user", "content": messages}]
        if isinstance(messages, dict):
            return [messages]
        if isinstance(messages, list):
            return messages
        raise ValueError("messages must be str, dict, or list[dict]")

    async def _add_direct(
        self, messages: list[dict[str, Any]], metadata: dict[str, Any]
    ) -> dict[str, Any]:
        results: list[dict[str, Any]] = []
        for msg in messages:
            if not isinstance(msg, dict) or "content" not in msg:
                continue
            if msg.get("role") == "system":
                continue
            meta = deepcopy(metadata)
            meta["role"] = msg.get("role", "user")
            mem_id = await self._write_memory(msg["content"], meta)
            results.append({"id": mem_id, "memory": msg["content"], "event": "ADD"})
        return {"results": results}

    async def _add_with_inference(
        self,
        messages: list[dict[str, Any]],
        metadata: dict[str, Any],
        filters: dict[str, Any],
    ) -> dict[str, Any]:
        transcript = format_chat(messages)
        new_facts = await self._extract_facts(transcript, messages, metadata)

        if not new_facts:
            return {"results": []}

        existing, new_embeddings = await self._find_collisions(new_facts, filters)
        actions = await self._resolve_actions(existing=existing, new_facts=new_facts)
        return await self._apply_actions(
            actions=actions,
            existing=existing,
            new_facts=new_facts,
            structured_facts=None,
            base_meta=metadata,
            new_embeddings=new_embeddings,
        )

    async def _extract_facts(
        self,
        transcript: str,
        messages: list[dict[str, Any]],
        metadata: dict[str, Any],
    ) -> list[str]:
        has_assistant = any(msg.get("role") == "assistant" for msg in messages)
        is_agent_memory = (
            metadata.get("agent_id") is not None and has_assistant
        )
        system_prompt, user_prompt = get_fact_retrieval_messages(
            transcript, is_agent_memory
        )
        response = await self.llm.generate_response(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )
        if self.graph:
            try:
                await self.graph.add(transcript, metadata)
            except Exception:
                logger.exception("Graph ingest failed")
        try:
            text = response if isinstance(response, str) else str(response.get("content", ""))
            text = strip_code_fences(text)
            if not text.strip():
                return []
            try:
                return json.loads(text)["facts"]
            except json.JSONDecodeError:
                return json.loads(recover_json(text))["facts"]
        except Exception:
            logger.exception("Fact extraction failed")
            return []

    async def _extract_structured_facts(
        self, transcript: str, filters: dict[str, Any]
    ) -> list[dict[str, Any]]:
        system_prompt, user_prompt = get_structured_fact_messages(transcript)
        response = await self.llm.generate_response(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )
        if self.graph:
            try:
                await self.graph.add(transcript, filters)
            except Exception:
                logger.exception("Graph ingest failed")
        try:
            text = (
                response
                if isinstance(response, str)
                else str(response.get("content", ""))
            )
            text = strip_code_fences(text)
            if not text.strip():
                return []
            try:
                return json.loads(text).get("structured_facts", [])
            except json.JSONDecodeError:
                return json.loads(recover_json(text)).get("structured_facts", [])
        except Exception:
            logger.exception("Structured-fact extraction failed")
            return []

    async def _find_collisions(
        self, new_facts: list[str], filters: dict[str, Any]
    ) -> tuple[list[dict[str, str]], dict[str, list[float]]]:
        """Embed + vector-search each fact in parallel; return neighbours + cached embeddings."""
        new_embeddings: dict[str, list[float]] = {}

        async def _scan(fact: str) -> list[dict[str, str]]:
            embedding = await self.embedder.embed(fact, "index")
            new_embeddings[fact] = embedding
            hits = await self.vector_store.search(
                query=fact, vectors=embedding, limit=5, filters=filters
            )
            return [{"id": h.id, "text": h.payload.get("data", "")} for h in hits]

        groups = await asyncio.gather(*[_scan(f) for f in new_facts])
        flat = [m for group in groups for m in group]
        deduped: dict[str, dict[str, str]] = {}
        for mem in flat:
            deduped[mem["id"]] = mem
        return list(deduped.values()), new_embeddings

    async def _resolve_actions(
        self,
        existing: list[dict[str, str]],
        new_facts: list[str],
    ) -> dict[str, list[dict[str, Any]]]:
        """Ask the LLM whether each fact is ADD / UPDATE / DELETE / NONE."""
        if not new_facts:
            return {"memory": []}
        if not existing:
            return {
                "memory": [
                    {"id": str(i), "text": fact, "event": "ADD"}
                    for i, fact in enumerate(new_facts)
                ]
            }
        prompt = get_update_memory_prompt(existing, new_facts)
        try:
            response = await self.llm.generate_response(
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
            )
        except Exception:
            logger.exception("Memory-action resolution failed")
            return {"memory": []}
        try:
            text = (
                response
                if isinstance(response, str)
                else str(response.get("content", ""))
            )
            text = strip_code_fences(text)
            return json.loads(text) if text.strip() else {"memory": []}
        except Exception:
            logger.exception("Action JSON parse failed")
            return {"memory": []}

    async def _apply_actions(
        self,
        *,
        actions: dict[str, list[dict[str, Any]]],
        existing: list[dict[str, str]],
        new_facts: list[str],
        structured_facts: list[dict[str, Any]] | None,
        base_meta: dict[str, Any],
        new_embeddings: dict[str, list[float]],
    ) -> dict[str, list[dict[str, Any]]]:
        temp_id_map: dict[str, str] = {}
        for idx, mem in enumerate(existing):
            temp_id_map[str(idx)] = mem["id"]
            mem["id"] = str(idx)

        fact_data_map = (
            {f.get("content", ""): f for f in structured_facts}
            if structured_facts
            else {}
        )
        results: list[dict[str, Any]] = []
        for action in actions.get("memory", []):
            try:
                text = action.get("text")
                if not text:
                    continue
                event = action.get("event")
                struct = fact_data_map.get(text, {})
                meta = deepcopy(base_meta)
                meta["memory_type"] = struct.get("memory_type", "simple") or "simple"
                meta["category"] = struct.get("category")
                meta["importance"] = struct.get("importance", "normal") or "normal"
                if meta["memory_type"] == "decision":
                    meta["decision_context"] = {
                        "goal": struct.get("goal"),
                        "constraints": struct.get("constraints", []),
                        "alternatives": struct.get("alternatives", []),
                        "final_choice": struct.get("final_choice"),
                        "reasoning": struct.get("reasoning"),
                        "emotional_state": struct.get("emotional_state"),
                    }
                if event == "ADD":
                    mem_id = await self._write_memory(
                        text, meta, existing_embeddings=new_embeddings
                    )
                    result: dict[str, Any] = {
                        "id": mem_id,
                        "memory": text,
                        "event": "ADD",
                        "memory_type": meta["memory_type"],
                    }
                    if meta["memory_type"] == "decision":
                        result["decision_context"] = meta["decision_context"]
                    results.append(result)
                elif event == "UPDATE":
                    real_id = temp_id_map.get(action.get("id"))
                    if not real_id:
                        continue
                    await self._write_update(
                        real_id,
                        text,
                        meta,
                        existing_embeddings=new_embeddings,
                    )
                    upd_result: dict[str, Any] = {
                        "id": real_id,
                        "memory": text,
                        "event": "UPDATE",
                        "previous_memory": action.get("old_memory"),
                        "memory_type": meta["memory_type"],
                    }
                    if meta["memory_type"] == "decision":
                        upd_result["decision_context"] = meta["decision_context"]
                    results.append(upd_result)
                elif event == "DELETE":
                    real_id = temp_id_map.get(action.get("id"))
                    if not real_id:
                        continue
                    await self._delete_memory(real_id)
                    results.append(
                        {"id": real_id, "memory": text, "event": "DELETE"}
                    )
            except Exception:
                logger.exception("Action application failed: %s", action)
        return {"results": results}

    # -- storage primitives ------------------------------------------------

    async def _write_memory(
        self,
        data: str,
        metadata: dict[str, Any],
        existing_embeddings: dict[str, list[float]] | None = None,
    ) -> str:
        content_hash = hashlib.md5(data.encode()).hexdigest()
        filters: dict[str, Any] = {
            k: metadata[k]
            for k in ("user_id", "agent_id", "run_id")
            if k in metadata
        }
        if filters:
            existing_mems, _ = await self.vector_store.list(
                filters=filters, limit=100
            )
            for mem in existing_mems:
                if mem.payload.get("hash") == content_hash:
                    return mem.id
        if existing_embeddings and data in existing_embeddings:
            embedding = existing_embeddings[data]
        else:
            embedding = await self.embedder.embed(data, "index")
        mem_id = str(uuid.uuid4())
        now = _now_iso()
        metadata["data"] = data
        metadata["hash"] = content_hash
        metadata["created_at"] = now
        await self.vector_store.insert(
            vectors=[embedding], ids=[mem_id], payloads=[metadata]
        )
        await self.history_db.add_history(
            memory_id=mem_id, event="ADD", new_memory=data, created_at=_now()
        )
        return mem_id

    async def _write_update(
        self,
        memory_id: str,
        data: str,
        metadata: dict[str, Any],
        existing_embeddings: dict[str, list[float]] | None = None,
    ) -> None:
        existing = await self.vector_store.get(memory_id)
        if not existing:
            logger.warning("Memory not found for update: %s", memory_id)
            return
        old_data = existing.payload.get("data", "")
        old_hash = existing.payload.get("hash", "")
        new_hash = hashlib.md5(data.encode()).hexdigest()
        if old_hash == new_hash:
            return

        if existing_embeddings and data in existing_embeddings:
            embedding = existing_embeddings[data]
        else:
            embedding = await self.embedder.embed(data, "update")

        # Type-priority merge: don't downgrade memory_type.
        old_type = existing.payload.get("memory_type", "simple")
        new_type = metadata.get("memory_type", "simple")
        if _TYPE_PRIORITY.get(new_type, 0) <= _TYPE_PRIORITY.get(old_type, 0):
            metadata["memory_type"] = old_type
            if old_type == "decision":
                old_ctx = existing.payload.get("decision_context") or {}
                new_ctx = metadata.get("decision_context") or {}
                for key, value in new_ctx.items():
                    if value and (
                        not old_ctx.get(key) or value != old_ctx.get(key)
                    ):
                        old_ctx[key] = value
                metadata["decision_context"] = old_ctx

        # Preserve category + importance if new value is weaker.
        if metadata.get("category") is None and existing.payload.get("category"):
            metadata["category"] = existing.payload["category"]
        old_imp = existing.payload.get("importance", "normal")
        new_imp = metadata.get("importance", "normal")
        if _IMPORTANCE_PRIORITY.get(new_imp, 0) < _IMPORTANCE_PRIORITY.get(old_imp, 0):
            metadata["importance"] = old_imp

        now = _now_iso()
        new_payload = deepcopy(existing.payload)
        new_payload.update(metadata)
        new_payload["data"] = data
        new_payload["hash"] = new_hash
        new_payload["updated_at"] = now
        changelog = new_payload.get("changelog", [])
        changelog.append(
            {"previous_value": old_data, "changed_to": data, "changed_at": now}
        )
        new_payload["changelog"] = changelog

        await self.vector_store.update(
            vector_id=memory_id, vector=embedding, payload=new_payload
        )
        await self.history_db.add_history(
            memory_id=memory_id,
            event="UPDATE",
            old_memory=old_data,
            new_memory=data,
            updated_at=_now(),
        )

    async def _delete_memory(self, memory_id: str) -> None:
        existing = await self.vector_store.get(memory_id)
        if existing:
            await self.history_db.add_history(
                memory_id=memory_id,
                event="DELETE",
                old_memory=existing.payload.get("data", ""),
                updated_at=_now(),
            )
        await self.vector_store.delete(memory_id)
        await self.history_db.delete_history(memory_id)


# ---- output formatter ----------------------------------------------------


def _format_memory(
    memory: SearchResult, include_score: bool = False
) -> dict[str, Any]:
    payload = memory.payload
    result: dict[str, Any] = {
        "id": memory.id,
        "memory": payload.get("data", ""),
        "hash": payload.get("hash"),
        "created_at": payload.get("created_at"),
        "updated_at": payload.get("updated_at"),
    }
    if include_score:
        result["score"] = memory.score
    for key in ("user_id", "agent_id", "run_id", "role"):
        if key in payload:
            result[key] = payload[key]
    for key in ("memory_type", "category", "importance", "decision_context"):
        if key in payload:
            result[key] = payload[key]
    if payload.get("changelog"):
        result["changelog"] = payload["changelog"]
    excluded = {
        "data", "hash", "created_at", "updated_at", "user_id", "agent_id",
        "run_id", "role", "memory_type", "category", "importance",
        "decision_context", "privacy_level", "changelog",
    }
    extra = {k: v for k, v in payload.items() if k not in excluded}
    if extra:
        result["metadata"] = extra
    return result