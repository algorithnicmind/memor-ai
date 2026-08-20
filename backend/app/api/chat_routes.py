"""Chat routes — recall context, ask the LLM, record the turn into a
chat-history conversation, then queue memory ingest in the background.

Each handler:
  1. Resolves user_id from current_user (NEVER from the request body -
     prevents forged user_id reading another user's memories).
  2. Searches for related memories (vector + graph) for context.
  3. Calls the LLM with the assembled context and returns the reply.
  4. Records both the user message and the assistant reply into a
     ChatConversation (creating one if conversation_id is missing).
  5. Fire-and-forget: schedules a background ingest of the user
     message into the typed-memory store. The user already has
     their reply by the time facts land.

The chat-history surface (conversations list, single conversation,
delete) lives here too - it's all /api/chat/*.

All handlers are async + msgspec-only; routes gated by `current_user`.
"""

from __future__ import annotations

import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import current_user, get_memory, msgspec_body
from app.api.msgspec_response import to_jsonable
from app.api.schemas import (
    ChatMessageDTO,
    ChatRequest,
    ChatResponse,
    ConversationMessagesResponse,
    ConversationsListResponse,
    SearchRequest,
    SearchResponse,
)
from app.domains.auth.models import User
from app.domains.chat_history import service as history_service
from app.domains.ingest import drain_one
from app.domains.memory.service import Memory

router = APIRouter(prefix="/api/chat", tags=["chat"])


_CHAT_SYSTEM_PROMPT = """You are Memorai, a friendly and helpful AI with perfect memory of past conversations with this user.

Use the provided memories + graph relationships to give a personalised, contextual reply. Reference relevant memories naturally - don't list them.

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


@router.post("", response_model=None)
async def chat(
    req: Annotated[ChatRequest, Depends(msgspec_body(ChatRequest))],
    user: Annotated[User, Depends(current_user)],
    memory: Annotated[Memory, Depends(get_memory)],
) -> ChatResponse:
    if not req.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="message is required"
        )

    # 1) Resolve or create the conversation this turn belongs to.
    conversation = await history_service.get_or_create_conversation(
        user, req.conversation_id
    )

    # 2) Recall - pull the top-k memories + graph hits for context.
    #    Note: the just-sent message isn't in the memory store yet
    #    (ingest is deferred to the background drainer). The reply
    #    doesn't depend on its own message being recalled, so this
    #    is fine — the user said it, they don't need to see it back.
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

    # 4) Record the raw transcript turn. Independent of the memory store:
    #    the typed-memory extraction (now background) is what gets
    #    recalled later; the chat history is what the user sees in
    #    the sidebar.
    user_message = await history_service.record_turn(
        conversation, "user", req.message
    )
    await history_service.record_turn(conversation, "assistant", response_text)

    # 5) Fire-and-forget: extract typed memories in the background.
    #    The user already has their reply. If the drainer fails it
    #    bumps `ingest_attempts` and the periodic drain_loop will
    #    pick it up later — no message is silently lost.
    asyncio.create_task(drain_one(memory, user_message.id))

    return to_jsonable(ChatResponse(
        response=response_text,
        stored=[],  # ingest is async; populated on the next recall
        relations=recall.get("relations", []),
        conversation_id=conversation.id,
    ))


@router.post("/search", response_model=None)
async def search(
    req: Annotated[SearchRequest, Depends(msgspec_body(SearchRequest))],
    user: Annotated[User, Depends(current_user)],
    memory: Annotated[Memory, Depends(get_memory)],
) -> SearchResponse:
    recall = await memory.search(
        req.query,
        user_id=user.id,
        limit=req.limit,
        threshold=req.threshold,
    )
    return to_jsonable(SearchResponse(
        results=recall.get("results", []),
        relations=recall.get("relations", []),
    ))


# ---- Chat history -------------------------------------------------------


@router.get("/conversations", response_model=None)
async def list_conversations(
    user: Annotated[User, Depends(current_user)],
) -> ConversationsListResponse:
    """List the current user's chat threads, newest activity first."""
    summaries = await history_service.list_conversations(user)
    return to_jsonable(
        ConversationsListResponse(conversations=summaries)  # type: ignore[arg-type]
    )


@router.get("/conversations/{conversation_id}/messages", response_model=None)
async def get_conversation_messages(
    conversation_id: str,
    user: Annotated[User, Depends(current_user)],
) -> ConversationMessagesResponse:
    """Return a conversation's full message list, oldest first."""
    convo = await history_service.get_conversation_messages(user, conversation_id)
    if convo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="conversation not found"
        )
    messages = sorted(
        convo.messages,  # type: ignore[attr-defined]
        key=lambda m: m.created_at,
    )
    return to_jsonable(ConversationMessagesResponse(
        conversation_id=convo.id,
        title=convo.title,
        messages=[
            ChatMessageDTO(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at.isoformat(),
            )
            for m in messages
        ],
    ))


@router.delete("/conversations/{conversation_id}", response_model=None)
async def delete_conversation(
    conversation_id: str,
    user: Annotated[User, Depends(current_user)],
) -> dict[str, str]:
    """Delete a conversation thread (and its messages via FK cascade)."""
    deleted = await history_service.delete_conversation(user, conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="conversation not found"
        )
    return {"deleted": conversation_id}
