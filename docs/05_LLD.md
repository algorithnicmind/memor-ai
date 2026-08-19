# Low-Level Design (LLD)

## 1. Database Schemas (SQLite)

### Users
- `id` (UUID, PK)
- `email` (String, Unique)
- `password_hash` (String)
- `created_at` (Timestamp)

### Conversations
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `title` (String)
- `created_at` (Timestamp)

### Messages
- `id` (UUID, PK)
- `conversation_id` (UUID, FK)
- `role` (Enum: 'user', 'assistant', 'system')
- `content` (Text)
- `created_at` (Timestamp)

### Memories (Metadata)
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `type` (Enum: simple, preference, goal, plan, decision, experience, relationship, temporary)
- `content` (Text)
- `importance` (Float 0-1)
- `confidence` (Float 0-1)
- `status` (Enum: active, superseded, deleted)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Memory_History
- `id` (UUID, PK)
- `memory_id` (UUID, FK)
- `old_value` (Text)
- `new_value` (Text)
- `reason` (Text - e.g., "Conflict resolved: switched frameworks")
- `timestamp` (Timestamp)

## 2. Graph Schema (Kuzu)
- **Nodes**: `User`, `Entity` (e.g., Python, ML, Project)
- **Edges**: 
  - `User -> [learning, prefers, building, uses] -> Entity`
  - `Entity -> [used_for, domain, related_to] -> Entity`

## 3. Vector Storage Schema
- `id`: Maps to SQLite Memory `id`
- `embedding`: Float array
- `metadata`: `{"user_id": "...", "type": "...", "importance": 0.9}`

## 4. Context Builder Template

```text
SYSTEM:
You are Memorai, a personalized AI assistant.

USER MEMORY:
Profile:
{profile_memories}

Skills:
{skill_memories}

Goals & Plans:
{goal_memories}

Preferences & Decisions:
{preference_memories}

Current Context:
{recent_conversation_history}

User Question: {user_message}
```
