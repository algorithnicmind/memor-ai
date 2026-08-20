"""Chat route — store the message, recall related context, ask the LLM.

The route:
  1. Reads the message from ChatRequest.
  2. Resolves user_id from current_user (NEVER from the request body —
     prevents forged user_id reading another user's memories).
  3. Stores the message via memory.add() (fact extraction + graph).
  4. Searches for related memories (vector + graph) for context.
  5. Calls the LLM with the assembled context, returns the reply.

All handlers are async + msgspec-only; routes gated by `current_user`.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import current_user, get_memory
from app.api.schemas import ChatRequest, ChatResponse, SearchRequest, SearchResponse
from app.domains.auth.models import User
from app.domains.memory.service import Memory

router = APIRouter(prefix="/api/chat", tags=["chat"])


_CHAT_SYSTEM_PROMPT = """You are Memorai, a friendly and helpful AI with perfect memory of past conversations with this user.

Use the provided memories + graph relationships to give a personalised, contextual reply. Reference relevant memories naturally — don't list them.

If a memory seems outdated or contradictory, ask for clarification.

Keep replies concise but warm; you are building a long-term relationship with this user.

{memory_context}
"""


def _memory_context_block(memories: list[dict], relations: list[dict]) -> str:
    if not memories and not relations:
        return ""
    parts: list[str] = []
    if memories:
        bullets = "\n".join(f"- {m.get('memory', '')}" for m in memories)
        parts.append(f"Relevant memories:\n{bullets}")
    if relations:
        bullets = "\n".join(
            f"- {r['source']} -- {r['relationship']} -- {r['destination']}"
            for r in relations
        )
        parts.append(f"Known relationships:\n{bullets}")
    return "\n\n".join(parts)


@router.post("")
async def chat(
    req: ChatRequest,
    user: Annotated[User, Depends(current_user)],
    memory: Annotated[Memory, Depends(get_memory)],
) -> ChatResponse:
    if not req.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="message is required"
        )

    # 1) Store. user_id comes from the token, never from the body.
    add_result = await memory.add(
        req.message,
        user_id=user.id,
        metadata=req.metadata,
    )

    # 2) Recall — pull the top-k memories + graph hits for context.
    recall = await memory.search(
        req.message,
        user_id=user.id,
        limit=5,
        threshold=0.3,
    )

    # 3) Ask the LLM.
    context_block = _memory_context_block(
        recall.get("results", []), recall.get("relations", [])
    )
    system_prompt = _CHAT_SYSTEM_PROMPT.format(memory_context=context_block)
    raw = await memory.llm.generate_response(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": req.message},
        ]
    )
    response_text = raw if isinstance(raw, str) else (raw.get("content") or "")

    return ChatResponse(
        response=response_text,
        stored=add_result.get("results", []),
        relations=recall.get("relations", []),
    )


@router.post("/search")
async def search(
    req: SearchRequest,
    user: Annotated[User, Depends(current_user)],
    memory: Annotated[Memory, Depends(get_memory)],
) -> SearchResponse:
    recall = await memory.search(
        req.query,
        user_id=user.id,
        limit=req.limit,
        threshold=req.threshold,
    )
    return SearchResponse(
        results=recall.get("results", []),
        relations=recall.get("relations", []),
    )