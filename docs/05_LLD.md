# Low-Level Design (LLD)

## 1. Database Schemas (SQLite)

### Vectors Table (Custom Vector Store)
- `id` (PRIMARY KEY, String/UUID)
- `collection` (INDEX, String - e.g., 'memories')
- `vector` (JSON - list of 768 floats from Gemini)
- `payload` (JSON - metadata including type, user_id, agent_id, run_id, confidence)
- `created_at` / `updated_at` (Timestamp)

## 2. Graph Schema (Kuzu)

### Entity Node
- `id`, `user_id`, `agent_id`, `run_id` (Strings)
- `name` (String)
- `mentions` (Int - counter for relevance tracking)
- `embedding` (FLOAT[768] - Native vector storage in Kuzu)
- `created` (Timestamp)

### CONNECTED_TO Relationship (Edges)
- `name` (String - relationship type)
- `mentions` (Int - counter to strengthen relationships over time)
- `created` / `updated` (Timestamp)

## 3. Decision Memory Schema
For decisions, Memorai captures full context using this exact structure:
```json
{
  "decision_id": "decision_2026_01_04_abc123",
  "goal": "Choose a programming language",
  "constraints": ["limited time", "need job market viability"],
  "alternatives": ["Python", "JavaScript", "Go"],
  "final_choice": "Python",
  "reasoning": "Strong AI/ML ecosystem",
  "emotional_state": "excited but overwhelmed",
  "confidence": 0.85
}
```

## 4. API Endpoints

### `POST /chat`
Sends a message and receives an AI response with memory context.
**Request:**
```json
{
  "message": "I'm learning Python for AI development",
  "user_id": "user_123",
  "system_prompt": "You are a helpful assistant"
}
```
**Response:**
```json
{
  "response": "That's great! Since you mentioned earlier...",
  "memories_used": [
    {
      "id": "mem_abc123",
      "memory": "User is interested in machine learning",
      "memory_type": "preference",
      "score": 0.89
    }
  ],
  "relations_used": [
    {
      "source": "user_123",
      "relationship": "learning",
      "destination": "python"
    }
  ]
}
```

### `GET /memories?user_id={userId}`
Retrieve all memories for a user.

### `DELETE /memories?user_id={userId}`
Clear all memories for a user.

### `GET /health`
Health check endpoint.
