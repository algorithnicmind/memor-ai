"""
Memorai LLM Prompts
All prompts used for interacting with the LLM
"""

# System prompt for the main chat
SYSTEM_PROMPT = """You are Memorai, a friendly and helpful AI assistant with perfect memory.

You remember everything the user has told you across all conversations. Use the provided memories and relationships to give personalized, contextual responses.

Guidelines:
1. Reference relevant memories naturally in your responses
2. If you remember something about the user, mention it when relevant
3. Be warm and personable - you're building a long-term relationship
4. If memories seem outdated or contradictory, ask for clarification
5. Keep responses concise but helpful

{context}

Remember: You're not just answering questions, you're having a conversation with someone you know well."""


# Prompt for extracting facts from user messages
FACT_EXTRACTION_PROMPT = """Analyze the following message and extract any facts worth remembering about the user.

MESSAGE: "{message}"

For each fact, classify it as one of:
- simple: Basic facts (name, age, location, job)
- decision: A choice the user made (what they chose and why)
- preference: Likes, dislikes, preferences
- plan: Future intentions or goals

Also identify any entities (people, places, companies, technologies, concepts) and their relationships.

Respond in this JSON format:
{{
    "facts": [
        {{
            "content": "the fact to remember",
            "memory_type": "simple|decision|preference|plan",
            "entities": ["entity1", "entity2"],
            "relationships": [
                {{"source": "entity1", "relation": "relationship_type", "target": "entity2"}}
            ]
        }}
    ],
    "should_save": true
}}

If the message contains no memorable facts (like "hello", "thanks", etc.), respond with:
{{"facts": [], "should_save": false}}

Important:
- Only extract facts that would be useful to remember in future conversations
- Be specific and concise in the fact content
- Don't invent facts - only extract what's explicitly stated or clearly implied"""


# Prompt for checking if a new fact conflicts with existing memories
CONFLICT_CHECK_PROMPT = """Check if this new information conflicts with or updates existing memories.

NEW INFORMATION: "{new_fact}"

EXISTING MEMORIES:
{existing_memories}

Respond in JSON format:
{{
    "action": "add|update|delete|none",
    "reason": "brief explanation",
    "existing_memory_id": "id of memory to update/delete if applicable"
}}

Actions:
- add: New information that doesn't conflict with anything
- update: New information that supersedes/updates an existing memory
- delete: Information that invalidates an existing memory
- none: Information already exists or isn't worth saving"""


# Prompt for generating contextual responses
CONTEXT_PROMPT = """Here's what you know about this user:

MEMORIES:
{memories}

RELATIONSHIPS:
{relations}

Use this information naturally in your response when relevant. Don't list the memories - integrate them smoothly into conversation."""


# Prompt for summarizing long conversation history
SUMMARIZE_PROMPT = """Summarize the key facts and events from this conversation that should be remembered:

CONVERSATION:
{conversation}

Provide a concise summary of:
1. Any new facts about the user
2. Decisions they made
3. Preferences they expressed
4. Plans they mentioned

Format as a bullet list of memorable facts."""
