"""Chat history service.

Conversations and messages are stored as raw transcripts, separate
from the typed-memory store (which extracts facts). Each `POST /api/chat`
records the user message and the assistant reply into a conversation;
the conversation_id returned lets the client keep appending to the
same thread on follow-up calls.

Ponytail: a single `_title_from_first_message` helper for sidebar
labels. A future "rename conversation" feature would slot in next
to it without disturbing the rest of the API.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from app.domains.auth.models import User
from app.infrastructure.database.models import ChatConversation, ChatMessage

# Title truncation for sidebar labels. Anything longer gets a
# trailing ellipsis.
_TITLE_MAX = 80


def _new_id() -> str:
    return uuid.uuid4().hex


def _iso(dt: datetime | None) -> str:
    return dt.isoformat() if dt is not None else ""


def _title_from_first_message(text: str) -> str:
    """Generate a sidebar title from the first user message."""
    cleaned = " ".join(text.split())
    if len(cleaned) <= _TITLE_MAX:
        return cleaned or "New conversation"
    return cleaned[: _TITLE_MAX - 1].rstrip() + "…"


async def get_or_create_conversation(
    user: User, conversation_id: str | None
) -> ChatConversation:
    """Resolve `conversation_id` to a conversation owned by `user`.

    If `conversation_id` is None or doesn't belong to the user,
    a fresh conversation is created. Cross-user IDs are treated as
    'not found' rather than 403 so we don't leak the existence of
    other users' conversations.
    """
    if conversation_id:
        convo = await ChatConversation.get_or_none(id=conversation_id)
        if convo is not None and convo.user_id == user.id:
            return convo
    return await ChatConversation.create(
        id=_new_id(),
        user=user,
        title="New conversation",
    )


async def record_turn(
    conversation: ChatConversation,
    role: str,
    content: str,
) -> ChatMessage:
    """Append a single turn to the conversation.

    The first user message also seeds the conversation title.
    `conversation.updated_at` is bumped so the sidebar sort works
    without a separate `last_message_at` column.
    """
    is_first_message = (
        await ChatMessage.filter(conversation=conversation).count() == 0
    )
    message = await ChatMessage.create(
        id=_new_id(),
        conversation=conversation,
        role=role,
        content=content,
    )
    if is_first_message and role == "user":
        conversation.title = _title_from_first_message(content)
    # Touch updated_at even if title didn't change.
    await conversation.save(update_fields=["title", "updated_at"])
    return message


async def list_conversations(user: User) -> list[dict[str, str]]:
    """Return all of `user`'s conversations, newest first.

    `last_message_at` is read off the most recent message per
    conversation. For an empty conversation we fall back to
    `updated_at` so the sidebar doesn't render blank times.
    """
    convos = await (
        ChatConversation.filter(user=user)
        .order_by("-updated_at")
        .all()
    )
    out: list[dict[str, str]] = []
    for convo in convos:
        latest = (
            await ChatMessage.filter(conversation=convo)
            .order_by("-created_at")
            .first()
        )
        last = latest.created_at if latest else convo.updated_at
        out.append(
            {
                "id": convo.id,
                "title": convo.title,
                "created_at": _iso(convo.created_at),
                "last_message_at": _iso(last),
            }
        )
    return out


async def get_conversation_messages(
    user: User, conversation_id: str
) -> ChatConversation | None:
    """Fetch a conversation (with messages prefetched) if owned by `user`.

    Returns None when the conversation doesn't exist or belongs to
    someone else; the route layer turns that into 404.
    """
    convo = await (
        ChatConversation.get_or_none(id=conversation_id)
        .prefetch_related("messages")
    )
    if convo is None or convo.user_id != user.id:
        return None
    return convo


async def delete_conversation(user: User, conversation_id: str) -> bool:
    """Delete a conversation owned by `user`. Returns True if deleted."""
    convo = await ChatConversation.get_or_none(id=conversation_id)
    if convo is None or convo.user_id != user.id:
        return False
    await convo.delete()
    return True
