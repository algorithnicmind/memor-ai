"""
Kuzu Graph Storage implementation.
Direct implementation for knowledge graph operations.
"""

import json
import logging
from typing import Any, cast

try:
    import kuzu
except ImportError as err:
    raise ImportError(
        "kuzu is not installed. Please install it using pip install kuzu"
    ) from err

try:
    from rank_bm25 import BM25Okapi
except ImportError as err:
    raise ImportError(
        "rank_bm25 is not installed. Please install it using pip install rank-bm25"
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


def format_entities(entities: list[dict[str, Any]]) -> str:
    """Format entities for display."""
    if not entities:
        return ""

    formatted_lines = []
    for entity in entities:
        simplified = (
            f"{entity['source']} -- {entity['relationship']} -- {entity['destination']}"
        )
        formatted_lines.append(simplified)

    return "\n".join(formatted_lines)


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
            provider_config: Optional provider config (chat + embeddings share one).
        """
        self.config = config or GraphStoreConfig()

        provider = provider_config or ProviderConfig()

        # Embeddings — same OpenAI-SDK-compatible client.
        self.embedder = OpenAICompatibleEmbedder(provider)
        self.embedding_dims = self.embedder.embedding_dims

        # LLM — same provider, chat surface.
        self.llm = OpenAICompatibleLLM(provider)

        # Initialize Kuzu database
        self.db = kuzu.Database(self.config.db_path)
        self.graph = kuzu.Connection(self.db)

        # Labels
        self.node_label = ":Entity"
        self.rel_label = ":CONNECTED_TO"

        # Create schema
        self._create_schema()

        # Threshold for similarity
        self.threshold = self.config.threshold

    def _create_schema(self) -> None:
        """Create the graph schema."""
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

        logger.info("Kuzu schema created successfully")

    def _execute(
        self, query: str, parameters: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        """Execute a Kuzu query.

        Args:
            query: The Cypher query to execute.
            parameters: Optional query parameters.

        Returns:
            List of result dictionaries.
        """
        raw_results = cast(Any, self.graph.execute(query, parameters))
        if hasattr(raw_results, "rows_as_dict"):
            return list(raw_results.rows_as_dict())
        if isinstance(raw_results, list):
            rows: list[dict[str, Any]] = []
            for item in raw_results:
                if hasattr(item, "rows_as_dict"):
                    rows.extend(list(item.rows_as_dict()))
            return rows
        return []

    async def add(self, data: str, filters: dict[str, Any]) -> dict[str, Any]:
        """Add data to the graph.

        Args:
            data: The data to add to the graph.
            filters: Filters containing user_id, agent_id, run_id.

        Returns:
            Dictionary with deleted and added entities.
        """
        # Extract entities from data
        entity_type_map = await self._retrieve_nodes_from_data(data, filters)

        # Establish relationships
        to_be_added = await self._establish_relations(data, filters, entity_type_map)

        # Search for existing similar entities
        search_output = await self._search_graph(
            node_list=list(entity_type_map.keys()),
            filters=filters,
        )

        # Determine what to delete
        to_be_deleted = await self._get_delete_entities(search_output, data, filters)

        # Perform deletions and additions
        deleted_entities = await self._delete_entities(to_be_deleted, filters)
        added_entities = await self._add_entities(to_be_added, filters, entity_type_map)

        return {
            "deleted_entities": deleted_entities,
            "added_entities": added_entities,
        }

    async def search(
        self, query: str, filters: dict[str, Any], limit: int = 5
    ) -> list[dict[str, str]]:
        """Search for related entities in the graph.

        Args:
            query: The search query.
            filters: Filters containing user_id, agent_id, run_id.
            limit: Maximum number of results.

        Returns:
            List of relationship dictionaries.
        """
        # Extract entities from query
        entity_type_map = await self._retrieve_nodes_from_data(query, filters)

        # Search for related entities
        search_output = await self._search_graph(
            node_list=list(entity_type_map.keys()),
            filters=filters,
        )

        if not search_output:
            return []

        # Prepare for BM25 ranking
        search_outputs_sequence = [
            [item["source"], item["relationship"], item["destination"]]
            for item in search_output
        ]

        bm25 = BM25Okapi(search_outputs_sequence)
        tokenized_query = query.split(" ")
        reranked_results = bm25.get_top_n(
            tokenized_query, search_outputs_sequence, n=limit
        )

        search_results = []
        for item in reranked_results:
            search_results.append(
                {
                    "source": item[0],
                    "relationship": item[1],
                    "destination": item[2],
                }
            )

        logger.info(f"Returned {len(search_results)} graph search results")
        return search_results

    async def get_all(
        self, filters: dict[str, Any], limit: int = 100
    ) -> list[dict[str, str]]:
        """Get all relationships from the graph.

        Args:
            filters: Filters containing user_id, agent_id, run_id.
            limit: Maximum number of results.

        Returns:
            List of relationship dictionaries.
        """
        params = {
            "user_id": filters["user_id"],
            "limit": limit,
        }

        # Build node properties
        node_props = ["user_id: $user_id"]
        if filters.get("agent_id"):
            node_props.append("agent_id: $agent_id")
            params["agent_id"] = filters["agent_id"]
        if filters.get("run_id"):
            node_props.append("run_id: $run_id")
            params["run_id"] = filters["run_id"]
        node_props_str = ", ".join(node_props)

        query = f"""
        MATCH (n {self.node_label} {{{node_props_str}}})-[r]->(m {self.node_label} {{{node_props_str}}})
        RETURN
            n.name AS source,
            r.name AS relationship,
            m.name AS target
        LIMIT $limit
        """

        results = self._execute(query, parameters=params)

        final_results = []
        for result in results:
            final_results.append(
                {
                    "source": result["source"],
                    "relationship": result["relationship"],
                    "target": result["target"],
                }
            )

        logger.info(f"Retrieved {len(final_results)} relationships")
        return final_results

    async def delete_all(self, filters: dict[str, Any]) -> None:
        """Delete all entities for the given filters.

        Args:
            filters: Filters containing user_id, agent_id, run_id.
        """
        node_props = ["user_id: $user_id"]
        params = {"user_id": filters["user_id"]}

        if filters.get("agent_id"):
            node_props.append("agent_id: $agent_id")
            params["agent_id"] = filters["agent_id"]
        if filters.get("run_id"):
            node_props.append("run_id: $run_id")
            params["run_id"] = filters["run_id"]
        node_props_str = ", ".join(node_props)

        cypher = f"""
        MATCH (n {self.node_label} {{{node_props_str}}})
        DETACH DELETE n
        """

        self._execute(cypher, parameters=params)
        logger.info("Deleted all entities matching filters")

    async def _retrieve_nodes_from_data(
        self, data: str, filters: dict[str, Any]
    ) -> dict[str, str]:
        """Extract entities from text using LLM.

        Args:
            data: The text to extract entities from.
            filters: Filters containing user_id.

        Returns:
            Dictionary mapping entity names to their types.
        """
        response = await self.llm.generate_response(
            messages=[
                {
                    "role": "system",
                    "content": f"You are a smart assistant who understands entities and their types in a given text. If user message contains self reference such as 'I', 'me', 'my' etc. then use {filters['user_id']} as the source entity. Extract all the entities from the text. ***DO NOT*** answer the question itself if the given text is a question.",
                },
                {"role": "user", "content": data},
            ],
            tools=[EXTRACT_ENTITIES_TOOL],
        )

        if not isinstance(response, dict):
            return {}

        entity_type_map: dict[str, str] = {}

        try:
            for tool_call in response.get("tool_calls", []):
                if tool_call["name"] != "extract_entities":
                    continue
                arguments = tool_call["arguments"]
                if isinstance(arguments, str):
                    arguments = json.loads(arguments)
                for item in arguments.get("entities", []):
                    entity_type_map[item["entity"]] = item["entity_type"]
        except Exception as e:
            logger.exception(f"Error extracting entities: {e}")

        # Normalize entity names
        entity_type_map = {
            k.lower().replace(" ", "_"): v.lower().replace(" ", "_")
            for k, v in entity_type_map.items()
        }

        logger.debug(f"Extracted entities: {entity_type_map}")
        return entity_type_map

    async def _establish_relations(
        self, data: str, filters: dict[str, Any], entity_type_map: dict[str, str]
    ) -> list[dict[str, str]]:
        """Establish relationships between entities using LLM.

        Args:
            data: The text to extract relations from.
            filters: Filters containing user_id.
            entity_type_map: Map of entity names to types.

        Returns:
            List of relationship dictionaries.
        """
        user_identity = f"user_id: {filters['user_id']}"
        if filters.get("agent_id"):
            user_identity += f", agent_id: {filters['agent_id']}"
        if filters.get("run_id"):
            user_identity += f", run_id: {filters['run_id']}"

        system_content = EXTRACT_RELATIONS_PROMPT.replace("USER_ID", user_identity)
        system_content = system_content.replace("CUSTOM_PROMPT", "")

        messages = [
            {"role": "system", "content": system_content},
            {
                "role": "user",
                "content": f"List of entities: {list(entity_type_map.keys())}. \n\nText: {data}",
            },
        ]

        response = await self.llm.generate_response(
            messages=messages,
            tools=[RELATIONS_TOOL],
        )

        if not isinstance(response, dict):
            return []

        entities = []
        if response.get("tool_calls"):
            args = response["tool_calls"][0].get("arguments", {})
            if isinstance(args, str):
                args = json.loads(args)
            entities = args.get("entities", [])

        # Normalize entity names
        for item in entities:
            item["source"] = item["source"].lower().replace(" ", "_")
            item["relationship"] = item["relationship"].lower().replace(" ", "_")
            item["destination"] = item["destination"].lower().replace(" ", "_")

        logger.debug(f"Established relations: {entities}")
        return entities

    async def _search_graph(
        self, node_list: list[str], filters: dict[str, Any], limit: int = 100
    ) -> list[dict[str, Any]]:
        """Search for similar nodes in the graph.

        Args:
            node_list: List of node names to search for.
            filters: Filters containing user_id.
            limit: Maximum results per node.

        Returns:
            List of relationship dictionaries with similarity scores.
        """
        result_relations = []

        params = {
            "threshold": self.threshold,
            "user_id": filters["user_id"],
            "limit": limit,
        }

        # Build node properties
        node_props = ["user_id: $user_id"]
        if filters.get("agent_id"):
            node_props.append("agent_id: $agent_id")
            params["agent_id"] = filters["agent_id"]
        if filters.get("run_id"):
            node_props.append("run_id: $run_id")
            params["run_id"] = filters["run_id"]
        node_props_str = ", ".join(node_props)

        for node in node_list:
            n_embedding = await self.embedder.embed(node)
            params["n_embedding"] = n_embedding

            results = []
            for match_fragment in [
                f"(n)-[r]->(m {self.node_label} {{{node_props_str}}}) WITH n as src, r, m as dst, similarity",
                f"(m {self.node_label} {{{node_props_str}}})-[r]->(n) WITH m as src, r, n as dst, similarity",
            ]:
                try:
                    results.extend(
                        self._execute(
                            f"""
                            MATCH (n {self.node_label} {{{node_props_str}}})
                            WHERE n.embedding IS NOT NULL
                            WITH n, array_cosine_similarity(n.embedding, CAST($n_embedding,'FLOAT[{self.embedding_dims}]')) AS similarity
                            WHERE similarity >= CAST($threshold, 'DOUBLE')
                            MATCH {match_fragment}
                            RETURN
                                src.name AS source,
                                id(src) AS source_id,
                                r.name AS relationship,
                                id(r) AS relation_id,
                                dst.name AS destination,
                                id(dst) AS destination_id,
                                similarity
                            LIMIT $limit
                            """,
                            parameters=params,
                        )
                    )
                except Exception as e:
                    logger.debug(f"Graph search query failed: {e}")

            # Sort by similarity
            result_relations.extend(
                sorted(results, key=lambda x: x.get("similarity", 0), reverse=True)[
                    :limit
                ]
            )

        return result_relations

    async def _get_delete_entities(
        self,
        search_output: list[dict[str, Any]],
        data: str,
        filters: dict[str, Any],
    ) -> list[dict[str, str]]:
        """Determine which entities should be deleted.

        Args:
            search_output: Results from graph search.
            data: The new data being added.
            filters: Filters containing user_id.

        Returns:
            List of relationship dictionaries to delete.
        """
        if not search_output:
            return []

        search_output_string = format_entities(search_output)

        user_identity = f"user_id: {filters['user_id']}"
        if filters.get("agent_id"):
            user_identity += f", agent_id: {filters['agent_id']}"
        if filters.get("run_id"):
            user_identity += f", run_id: {filters['run_id']}"

        system_prompt, user_prompt = get_delete_messages(
            search_output_string, data, user_identity
        )

        response = await self.llm.generate_response(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            tools=[DELETE_MEMORY_TOOL],
        )

        if not isinstance(response, dict):
            return []

        to_be_deleted = []
        for item in response.get("tool_calls", []):
            if item.get("name") == "delete_graph_memory":
                args = item.get("arguments")
                if isinstance(args, str):
                    args = json.loads(args)
                # Normalize
                args["source"] = args["source"].lower().replace(" ", "_")
                args["relationship"] = args["relationship"].lower().replace(" ", "_")
                args["destination"] = args["destination"].lower().replace(" ", "_")
                to_be_deleted.append(args)

        logger.debug(f"Entities to delete: {to_be_deleted}")
        return to_be_deleted

    async def _delete_entities(
        self, to_be_deleted: list[dict[str, Any]], filters: dict[str, Any]
    ) -> list[list[dict[str, Any]]]:
        """Delete entities from the graph.

        Args:
            to_be_deleted: List of relationships to delete.
            filters: Filters containing user_id.

        Returns:
            List of deletion results.
        """
        user_id = filters["user_id"]
        agent_id = filters.get("agent_id")
        run_id = filters.get("run_id")
        results = []

        for item in to_be_deleted:
            source = item["source"]
            destination = item["destination"]
            relationship = item["relationship"]

            params = {
                "source_name": source,
                "dest_name": destination,
                "user_id": user_id,
                "relationship_name": relationship,
            }

            source_props = ["name: $source_name", "user_id: $user_id"]
            dest_props = ["name: $dest_name", "user_id: $user_id"]

            if agent_id:
                source_props.append("agent_id: $agent_id")
                dest_props.append("agent_id: $agent_id")
                params["agent_id"] = agent_id
            if run_id:
                source_props.append("run_id: $run_id")
                dest_props.append("run_id: $run_id")
                params["run_id"] = run_id

            source_props_str = ", ".join(source_props)
            dest_props_str = ", ".join(dest_props)

            cypher = f"""
            MATCH (n {self.node_label} {{{source_props_str}}})
            -[r {self.rel_label} {{name: $relationship_name}}]->
            (m {self.node_label} {{{dest_props_str}}})
            DELETE r
            RETURN
                n.name AS source,
                r.name AS relationship,
                m.name AS target
            """

            try:
                result = self._execute(cypher, parameters=params)
                results.append(result)
            except Exception as e:
                logger.debug(f"Delete failed: {e}")

        return results

    async def _add_entities(
        self,
        to_be_added: list[dict[str, Any]],
        filters: dict[str, Any],
        entity_type_map: dict[str, str],
    ) -> list[list[dict[str, Any]]]:
        """Add entities to the graph.

        Args:
            to_be_added: List of relationships to add.
            filters: Filters containing user_id.
            entity_type_map: Map of entity names to types.

        Returns:
            List of addition results.
        """
        user_id = filters["user_id"]
        agent_id = filters.get("agent_id")
        run_id = filters.get("run_id")
        results = []

        for item in to_be_added:
            source = item["source"]
            destination = item["destination"]
            relationship = item["relationship"]

            # Generate embeddings
            source_embedding = await self.embedder.embed(source)
            dest_embedding = await self.embedder.embed(destination)

            params = {
                "source_name": source,
                "dest_name": destination,
                "relationship_name": relationship,
                "source_embedding": source_embedding,
                "dest_embedding": dest_embedding,
                "user_id": user_id,
            }

            # Build merge properties
            source_props = ["name: $source_name", "user_id: $user_id"]
            dest_props = ["name: $dest_name", "user_id: $user_id"]

            if agent_id:
                source_props.append("agent_id: $agent_id")
                dest_props.append("agent_id: $agent_id")
                params["agent_id"] = agent_id
            if run_id:
                source_props.append("run_id: $run_id")
                dest_props.append("run_id: $run_id")
                params["run_id"] = run_id

            source_props_str = ", ".join(source_props)
            dest_props_str = ", ".join(dest_props)

            cypher = f"""
            MERGE (source {self.node_label} {{{source_props_str}}})
            ON CREATE SET
                source.created = current_timestamp(),
                source.mentions = 1,
                source.embedding = CAST($source_embedding,'FLOAT[{self.embedding_dims}]')
            ON MATCH SET
                source.mentions = coalesce(source.mentions, 0) + 1,
                source.embedding = CAST($source_embedding,'FLOAT[{self.embedding_dims}]')
            WITH source
            MERGE (destination {self.node_label} {{{dest_props_str}}})
            ON CREATE SET
                destination.created = current_timestamp(),
                destination.mentions = 1,
                destination.embedding = CAST($dest_embedding,'FLOAT[{self.embedding_dims}]')
            ON MATCH SET
                destination.mentions = coalesce(destination.mentions, 0) + 1,
                destination.embedding = CAST($dest_embedding,'FLOAT[{self.embedding_dims}]')
            WITH source, destination
            MERGE (source)-[rel {self.rel_label} {{name: $relationship_name}}]->(destination)
            ON CREATE SET
                rel.created = current_timestamp(),
                rel.mentions = 1
            ON MATCH SET
                rel.mentions = coalesce(rel.mentions, 0) + 1
            RETURN
                source.name AS source,
                rel.name AS relationship,
                destination.name AS target
            """

            try:
                result = self._execute(cypher, parameters=params)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to add entity: {e}")

        return results

    def reset(self) -> None:
        """Reset the graph by clearing all nodes and relationships."""
        logger.warning("Clearing graph...")
        self._execute("MATCH (n) DETACH DELETE n")
