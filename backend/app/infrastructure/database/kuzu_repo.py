"""Kuzu-backed knowledge graph.

The public surface is small: `add`, `search`, `get_all`, `delete_all`,
`reset`. Internally the work is `extract → find_collisions →
prune_stale → merge`, so the file reads as our own pipeline rather
than a port of any specific generic library's shape.
"""

from __future__ import annotations

import json
import logging
from typing import Any, cast

try:
    import kuzu
except ImportError as err:
    raise ImportError(
        "kuzu is not installed. Run: uv add kuzu"
    ) from err

try:
    from rank_bm25 import BM25Okapi
except ImportError as err:
    raise ImportError(
        "rank_bm25 is not installed. Run: uv add rank-bm25"
    ) from err

from app.core.config import GraphStoreConfig, ProviderConfig
from app.domains.chat.openai_compat import (
    DELETE_MEMORY_TOOL,
    EXTRACT_ENTITIES_TOOL,
    RELATIONS_TOOL,
    OpenAICompatibleLLM,
)
from app.infrastructure.embeddings.openai_compat import OpenAICompatibleEmbedder
from app.domains.memory.cortex_prompts import EXTRACT_RELATIONS_PROMPT, get_delete_messages

logger = logging.getLogger(__name__)


def _format_entities(entities: list[dict[str, Any]]) -> str:
    """Render an entity list as `src -- rel -- dst` lines for prompts."""
    return "\n".join(
        f"{e['source']} -- {e['relationship']} -- {e['destination']}" for e in entities
    )


def _normalize(s: str) -> str:
    return s.lower().replace(" ", "_")


class KuzuGraph:
    """Kuzu-based knowledge graph storage."""

    def __init__(
        self,
        config: GraphStoreConfig | None = None,
        provider_config: ProviderConfig | None = None,
    ) -> None:
        """Initialize Kuzu graph storage.

        Args:
            config: Optional graph store configuration.
            provider_config: Shared OpenAI-compatible provider config
                (chat + embeddings).
        """
        self.config = config or GraphStoreConfig()
        provider = provider_config or ProviderConfig()

        self.embedder = OpenAICompatibleEmbedder(provider)
        self.embedding_dims = self.embedder.embedding_dims
        self.llm = OpenAICompatibleLLM(provider)

        self.db = kuzu.Database(self.config.db_path)
        self.graph = kuzu.Connection(self.db)

        self.node_label = ":Entity"
        self.rel_label = ":CONNECTED_TO"

        self._bootstrap_schema()
        self.threshold = self.config.threshold

    # -- bootstrap ---------------------------------------------------------

    def _bootstrap_schema(self) -> None:
        """Create the graph schema if missing."""
        self._execute(
            """
            CREATE NODE TABLE IF NOT EXISTS Entity(
                id SERIAL PRIMARY KEY,
                user_id STRING,
                agent_id STRING,
                run_id STRING,
                name STRING,
                mentions INT64,
                created TIMESTAMP,
                embedding FLOAT[])
            """
        )
        self._execute(
            """
            CREATE REL TABLE IF NOT EXISTS CONNECTED_TO(
                FROM Entity TO Entity,
                name STRING,
                mentions INT64,
                created TIMESTAMP,
                updated TIMESTAMP
            )
            """
        )
        logger.info("Kuzu schema ready")

    def _execute(
        self, query: str, parameters: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        raw = cast(Any, self.graph.execute(query, parameters))
        if hasattr(raw, "rows_as_dict"):
            return list(raw.rows_as_dict())
        if isinstance(raw, list):
            rows: list[dict[str, Any]] = []
            for item in raw:
                if hasattr(item, "rows_as_dict"):
                    rows.extend(list(item.rows_as_dict()))
            return rows
        return []

    # -- filter scoping helpers --------------------------------------------

    @staticmethod
    def _node_props(filters: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        parts = ["user_id: $user_id"]
        params: dict[str, Any] = {"user_id": filters["user_id"]}
        if filters.get("agent_id"):
            parts.append("agent_id: $agent_id")
            params["agent_id"] = filters["agent_id"]
        if filters.get("run_id"):
            parts.append("run_id: $run_id")
            params["run_id"] = filters["run_id"]
        return ", ".join(parts), params

    # -- public surface ----------------------------------------------------

    async def add(self, data: str, filters: dict[str, Any]) -> dict[str, Any]:
        """Ingest text into the graph.

        Returns a summary of deleted + added relationships.
        """
        entities = await self._extract_nodes(data, filters)
        relations = await self._propose_relations(data, entities, filters)
        existing = await self._find_collisions(entities, filters)
        to_prune = await self._prune_stale(existing, data, filters)
        merge_summary = await self._merge_into_graph(relations, to_prune, filters)
        return merge_summary

    async def search(
        self, query: str, filters: dict[str, Any], limit: int = 5
    ) -> list[dict[str, str]]:
        """Search the graph for relationships relevant to `query`.

        Entities in the query seed a vector-similarity scan; surviving
        triples are reranked with BM25 against the query.
        """
        entities = await self._extract_nodes(query, filters)
        raw = await self._find_collisions(entities, filters)
        if not raw:
            return []
        triples = [[r["source"], r["relationship"], r["destination"]] for r in raw]
        reranked = BM25Okapi(query.split(" ")).get_top_n(triples, triples, n=limit)
        return [
            {"source": t[0], "relationship": t[1], "destination": t[2]}
            for t in reranked
        ]

    async def get_all(
        self, filters: dict[str, Any], limit: int = 100
    ) -> list[dict[str, str]]:
        """All relationships in the graph matching the filters."""
        node_props, params = self._node_props(filters)
        params["limit"] = limit
        query = f"""
        MATCH (n {self.node_label} {{{node_props}}})-[r]->(m {self.node_label} {{{node_props}}})
        RETURN n.name AS source, r.name AS relationship, m.name AS target
        LIMIT $limit
        """
        results = self._execute(query, parameters=params)
        return [
            {
                "source": row["source"],
                "relationship": row["relationship"],
                "destination": row["target"],
            }
            for row in results
        ]

    async def delete_all(self, filters: dict[str, Any]) -> None:
        """Drop all nodes matching the filters."""
        node_props, params = self._node_props(filters)
        cypher = f"MATCH (n {self.node_label} {{{node_props}}}) DETACH DELETE n"
        self._execute(cypher, parameters=params)
        logger.info("Deleted all entities matching filters")

    def reset(self) -> None:
        """Wipe the entire graph (no filter)."""
        logger.warning("Clearing graph...")
        self._execute("MATCH (n) DETACH DELETE n")

    # -- internal pipeline ------------------------------------------------

    async def _extract_nodes(
        self, text: str, filters: dict[str, Any]
    ) -> dict[str, str]:
        """Ask the LLM to list entities in `text`. Self-refs become user_id."""
        response = await self.llm.generate_response(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You identify entities in a text and their types. "
                        "If the text contains a self-reference ('I', 'me', 'my'), "
                        f"use {filters['user_id']} as the source entity. "
                        "Do not answer the question itself if the text is a question."
                    ),
                },
                {"role": "user", "content": text},
            ],
            tools=[EXTRACT_ENTITIES_TOOL],
        )
        if not isinstance(response, dict):
            return {}
        entity_type_map: dict[str, str] = {}
        try:
            for call in response.get("tool_calls", []):
                if call["name"] != "extract_entities":
                    continue
                args = call["arguments"]
                if isinstance(args, str):
                    args = json.loads(args)
                for item in args.get("entities", []):
                    entity_type_map[item["entity"]] = item["entity_type"]
        except Exception:
            logger.exception("Entity extraction failed")
        return {_normalize(k): _normalize(v) for k, v in entity_type_map.items()}

    async def _propose_relations(
        self, text: str, entities: dict[str, str], filters: dict[str, Any]
    ) -> list[dict[str, str]]:
        """Ask the LLM to propose source→rel→destination triples."""
        identity = f"user_id: {filters['user_id']}"
        if filters.get("agent_id"):
            identity += f", agent_id: {filters['agent_id']}"
        if filters.get("run_id"):
            identity += f", run_id: {filters['run_id']}"

        system = EXTRACT_RELATIONS_PROMPT.replace("USER_ID", identity).replace(
            "CUSTOM_PROMPT", ""
        )
        response = await self.llm.generate_response(
            messages=[
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": f"Entities: {list(entities.keys())}\n\nText: {text}",
                },
            ],
            tools=[RELATIONS_TOOL],
        )
        if not isinstance(response, dict) or not response.get("tool_calls"):
            return []
        args = response["tool_calls"][0].get("arguments", {})
        if isinstance(args, str):
            args = json.loads(args)
        triples = args.get("entities", [])
        for t in triples:
            t["source"] = _normalize(t["source"])
            t["relationship"] = _normalize(t["relationship"])
            t["destination"] = _normalize(t["destination"])
        return triples

    async def _find_collisions(
        self, entities: dict[str, str], filters: dict[str, Any], limit: int = 100
    ) -> list[dict[str, Any]]:
        """Vector-search existing nodes by entity-name embedding."""
        node_props, params = self._node_props(filters)
        params["threshold"] = self.threshold
        params["limit"] = limit

        results: list[dict[str, Any]] = []
        for name in entities:
            embedding = await self.embedder.embed(name)
            params["n_embedding"] = embedding
            for direction in ("src", "dst"):
                if direction == "src":
                    match = (
                        f"(n {self.node_label} {{{node_props}}})"
                        "-[r]->(m {self.node_label} {{{node_props}}}) "
                        "WITH n as src, r, m as dst, similarity"
                    )
                else:
                    match = (
                        f"(m {self.node_label} {{{node_props}}})"
                        "-[r]->(n) WITH m as src, r, n as dst, similarity"
                    )
                try:
                    rows = self._execute(
                        f"""
                        MATCH (n {self.node_label} {{{node_props}}})
                        WHERE n.embedding IS NOT NULL
                        WITH n, array_cosine_similarity(
                            n.embedding,
                            CAST($n_embedding,'FLOAT[{self.embedding_dims}]')
                        ) AS similarity
                        WHERE similarity >= CAST($threshold, 'DOUBLE')
                        MATCH {match}
                        RETURN src.name AS source, id(src) AS source_id,
                               r.name AS relationship, id(r) AS relation_id,
                               dst.name AS destination, id(dst) AS destination_id,
                               similarity
                        LIMIT $limit
                        """,
                        parameters=params,
                    )
                    results.extend(rows)
                except Exception:
                    logger.debug("Graph search query failed", exc_info=True)
        return sorted(results, key=lambda r: r.get("similarity", 0), reverse=True)[:limit]

    async def _prune_stale(
        self,
        existing: list[dict[str, Any]],
        new_text: str,
        filters: dict[str, Any],
    ) -> list[dict[str, str]]:
        """Let the LLM decide which existing triples to evict."""
        if not existing:
            return []
        identity = f"user_id: {filters['user_id']}"
        if filters.get("agent_id"):
            identity += f", agent_id: {filters['agent_id']}"
        if filters.get("run_id"):
            identity += f", run_id: {filters['run_id']}"

        system, user = get_delete_messages(_format_entities(existing), new_text, identity)
        response = await self.llm.generate_response(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            tools=[DELETE_MEMORY_TOOL],
        )
        if not isinstance(response, dict):
            return []
        doomed: list[dict[str, str]] = []
        for call in response.get("tool_calls", []):
            if call.get("name") != "delete_graph_memory":
                continue
            args = call.get("arguments")
            if isinstance(args, str):
                args = json.loads(args)
            args["source"] = _normalize(args["source"])
            args["relationship"] = _normalize(args["relationship"])
            args["destination"] = _normalize(args["destination"])
            doomed.append(args)
        return doomed

    async def _merge_into_graph(
        self,
        to_add: list[dict[str, str]],
        to_delete: list[dict[str, str]],
        filters: dict[str, Any],
    ) -> dict[str, list[Any]]:
        """Apply all deletes + merges in one pass; return a summary."""
        deleted = await self._delete_relationships(to_delete, filters)
        added = await self._merge_relationships(to_add, filters)
        return {"deleted_entities": deleted, "added_entities": added}

    async def _delete_relationships(
        self, doomed: list[dict[str, str]], filters: dict[str, Any]
    ) -> list[list[dict[str, Any]]]:
        """Delete the listed (source, rel, dst) triples."""
        results: list[list[dict[str, Any]]] = []
        for item in doomed:
            params = {
                "source_name": item["source"],
                "dest_name": item["destination"],
                "user_id": filters["user_id"],
                "relationship_name": item["relationship"],
            }
            src_props = ["name: $source_name", "user_id: $user_id"]
            dst_props = ["name: $dest_name", "user_id: $user_id"]
            if filters.get("agent_id"):
                src_props.append("agent_id: $agent_id")
                dst_props.append("agent_id: $agent_id")
                params["agent_id"] = filters["agent_id"]
            if filters.get("run_id"):
                src_props.append("run_id: $run_id")
                dst_props.append("run_id: $run_id")
                params["run_id"] = filters["run_id"]
            cypher = f"""
            MATCH (n {self.node_label} {{{', '.join(src_props)}}})
            -[r {self.rel_label} {{name: $relationship_name}}]->
            (m {self.node_label} {{{', '.join(dst_props)}}})
            DELETE r
            RETURN n.name AS source, r.name AS relationship, m.name AS target
            """
            try:
                results.append(self._execute(cypher, parameters=params))
            except Exception:
                logger.debug("Delete failed", exc_info=True)
        return results

    async def _merge_relationships(
        self, triples: list[dict[str, str]], filters: dict[str, Any]
    ) -> list[list[dict[str, Any]]]:
        """Upsert nodes + relationships; bump mention counts."""
        results: list[list[dict[str, Any]]] = []
        for item in triples:
            source = item["source"]
            dest = item["destination"]
            rel = item["relationship"]
            source_emb = await self.embedder.embed(source)
            dest_emb = await self.embedder.embed(dest)

            params: dict[str, Any] = {
                "source_name": source,
                "dest_name": dest,
                "relationship_name": rel,
                "source_embedding": source_emb,
                "dest_embedding": dest_emb,
                "user_id": filters["user_id"],
            }
            src_props = ["name: $source_name", "user_id: $user_id"]
            dst_props = ["name: $dest_name", "user_id: $user_id"]
            if filters.get("agent_id"):
                src_props.append("agent_id: $agent_id")
                dst_props.append("agent_id: $agent_id")
                params["agent_id"] = filters["agent_id"]
            if filters.get("run_id"):
                src_props.append("run_id: $run_id")
                dst_props.append("run_id: $run_id")
                params["run_id"] = filters["run_id"]
            cypher = f"""
            MERGE (source {self.node_label} {{{', '.join(src_props)}}})
            ON CREATE SET source.created = current_timestamp(),
                          source.mentions = 1,
                          source.embedding = CAST($source_embedding,'FLOAT[{self.embedding_dims}]')
            ON MATCH SET source.mentions = coalesce(source.mentions, 0) + 1,
                          source.embedding = CAST($source_embedding,'FLOAT[{self.embedding_dims}]')
            WITH source
            MERGE (destination {self.node_label} {{{', '.join(dst_props)}}})
            ON CREATE SET destination.created = current_timestamp(),
                          destination.mentions = 1,
                          destination.embedding = CAST($dest_embedding,'FLOAT[{self.embedding_dims}]')
            ON MATCH SET destination.mentions = coalesce(destination.mentions, 0) + 1,
                          destination.embedding = CAST($dest_embedding,'FLOAT[{self.embedding_dims}]')
            WITH source, destination
            MERGE (source)-[rel {self.rel_label} {{name: $relationship_name}}]->(destination)
            ON CREATE SET rel.created = current_timestamp(), rel.mentions = 1
            ON MATCH SET rel.mentions = coalesce(rel.mentions, 0) + 1
            RETURN source.name AS source, rel.name AS relationship, destination.name AS target
            """
            try:
                results.append(self._execute(cypher, parameters=params))
            except Exception:
                logger.error("Failed to add entity", exc_info=True)
        return results