"""Prompts for the memory pipeline.

Voice is our own — terse, instruction-following. `STRUCTURED_FACT_
EXTRACTION_PROMPT` predates the rewrite and stays as-is; the rest
were rewritten to fit the project's house style (no longer reads like
a copy of any popular generic library's templates).
"""

from datetime import datetime

# ----------------------------------------------------------------------
# Fact retrieval (used by Memory.add() — generic path, no type info)
# ----------------------------------------------------------------------

FACT_RETRIEVAL_PROMPT = f"""You organise conversations into discrete, recallable facts about the user.

Cover:
- Preferences (likes, dislikes, opinions)
- Personal details (name, location, relationships, important dates)
- Plans (upcoming events, trips, learning goals)
- Activity + service preferences (dining, travel, hobbies)
- Wellness (dietary, fitness routines)
- Professional (role, work habits, career direction)
- Misc (favourite media, brands, casual mentions)
- Decision context (the goal, constraints, alternatives considered, the final choice, why)

Few-shot:

Input: Hi.
Output: {{"facts": []}}

Input: There are branches in trees.
Output: {{"facts": []}}

Input: Hi, I'm looking for a restaurant in San Francisco.
Output: {{"facts": ["Looking for a restaurant in San Francisco"]}}

Input: Yesterday I had a meeting with John at 3pm. We discussed the new project.
Output: {{"facts": ["Had a meeting with John at 3pm", "Discussed the new project"]}}

Input: Hi, my name is John. I am a software engineer.
Output: {{"facts": ["Name is John", "Is a software engineer"]}}

Input: My favourite movies are Inception and Interstellar.
Output: {{"facts": ["Favourite movies are Inception and Interstellar"]}}

Rules:
- Today is {datetime.now().strftime("%Y-%m-%d")}.
- Match the user's language.
- Pull facts from user + assistant turns only. Ignore system.
- Return JSON with a top-level "facts" key (list of strings).

Extract the relevant facts from this conversation:
"""


# ----------------------------------------------------------------------
# Structured extraction (typed: simple / decision / preference / plan)
# Pre-existing prompt — kept verbatim. Captures typed decision context.
# ----------------------------------------------------------------------

STRUCTURED_FACT_EXTRACTION_PROMPT = f"""You are an advanced Personal Information Organizer that extracts and structures information from conversations.

Your task is to extract NEW facts from STATEMENTS and classify them by type.

## CRITICAL RULE - QUESTIONS vs STATEMENTS:
**NEVER extract facts from QUESTIONS.** Questions are asking for information, not providing it.

Return EMPTY list for:
- "Why did I choose X?" → NOT a fact, it's asking about past info
- "What alternatives did I consider?" → NOT a fact, it's a question
- "Should I try X now?" → NOT a fact, it's asking for advice
- "What constraints influenced my decision?" → NOT a fact, it's a question
- "What should I focus on next?" → NOT a fact, it's asking for recommendation

Only extract from STATEMENTS that provide NEW information:
- "I chose Python because..." → This IS a fact (decision)
- "My name is John" → This IS a fact (simple)
- "I prefer dark mode" → This IS a fact (preference)
- "I'm planning to learn Rust" → This IS a fact (plan)

## Memory Types:
1. **simple**: Basic facts, names, personal details
2. **decision**: Choices made with reasoning - CAPTURE ALL DETAILS
3. **preference**: Likes, dislikes, preferences
4. **plan**: Future intentions, goals, upcoming events

## CRITICAL: For DECISIONS, you MUST extract ALL of the following:
- **goal**: What was the user trying to achieve? (the main objective)
- **constraints**: What limitations or requirements affected the decision? (time, money, skill level, etc.)
- **alternatives**: ALL options that were considered/compared (extract EVERY option mentioned)
- **final_choice**: The decision that was made
- **reasoning**: Why this specific choice was made
- **emotional_state**: How the user feels about it (optional)
- **category**: Domain of the decision (career, tech, health, finance, personal, education, etc.)

## IMPORTANT EXTRACTION RULES:
1. **If the input is a QUESTION, return {{"structured_facts": []}}**
2. When user mentions multiple options (e.g., "considering X, Y, and Z"), ALL of them go in "alternatives"
3. Constraints can be implicit (e.g., "I have limited time" -> limited_time is a constraint)
4. Extract the reasoning even if brief (e.g., "has a strong machine-learning ecosystem")
5. The final_choice is the one they actually chose/decided on

## Output Format:
{{
  "structured_facts": [
    {{
      "content": "Clear summary of the fact including all key details",
      "memory_type": "simple|decision|preference|plan",
      "category": "category if applicable",
      "importance": "low|normal|high|critical",
      "goal": "only for decisions - what they were trying to achieve",
      "constraints": ["only", "for", "decisions", "- list all limitations"],
      "alternatives": ["all", "options", "that", "were", "considered"],
      "final_choice": "only for decisions - what was chosen",
      "reasoning": "only for decisions - why it was chosen",
      "emotional_state": "only for decisions - optional"
    }}
  ]
}}

## EXAMPLES:

### Example 1: Decision with multiple alternatives
Input: "I want to switch into AI-focused roles. I'm considering Python, JavaScript, and Go. I chose Python because it has a strong machine-learning ecosystem and I have limited time."

Output:
{{
  "structured_facts": [
    {{
      "content": "Wants to switch into AI-focused roles, chose Python over JavaScript and Go due to strong ML ecosystem and limited time",
      "memory_type": "decision",
      "category": "career",
      "importance": "high",
      "goal": "Switch into AI-focused roles",
      "constraints": ["limited time"],
      "alternatives": ["Python", "JavaScript", "Go"],
      "final_choice": "Python",
      "reasoning": "Python has a strong machine-learning ecosystem",
      "emotional_state": null
    }}
  ]
}}

### Example 2: Decision with implicit constraints
Input: "I decided to learn Python instead of Java because it's easier to get started and has more AI/ML libraries. I was worried about job prospects but the data shows Python is in high demand."

Output:
{{
  "structured_facts": [
    {{
      "content": "Chose Python over Java for learning programming due to ease of learning and AI/ML libraries",
      "memory_type": "decision",
      "category": "career",
      "importance": "high",
      "goal": "Learn a programming language",
      "constraints": ["ease of learning", "career prospects"],
      "alternatives": ["Python", "Java"],
      "final_choice": "Python",
      "reasoning": "Easier to get started, more AI/ML libraries, high job demand",
      "emotional_state": "initially worried but reassured by data"
    }}
  ]
}}

### Example 3: Simple fact and preference
Input: "My name is Sarah and I love hiking on weekends."

Output:
{{
  "structured_facts": [
    {{
      "content": "Name is Sarah",
      "memory_type": "simple",
      "category": "personal",
      "importance": "normal"
    }},
    {{
      "content": "Loves hiking on weekends",
      "memory_type": "preference",
      "category": "hobbies",
      "importance": "normal"
    }}
  ]
}}

### Example 4: Plan
Input: "I'm planning to learn Rust next month for systems programming."

Output:
{{
  "structured_facts": [
    {{
      "content": "Planning to learn Rust next month for systems programming",
      "memory_type": "plan",
      "category": "career",
      "importance": "normal"
    }}
  ]
}}

### Example 5: QUESTION - Returns EMPTY (no new facts)
Input: "Why did I choose saving over investing?"

Output:
{{
  "structured_facts": []
}}

### Example 6: QUESTION - Returns EMPTY (asking for advice)
Input: "Should I try Go now?"

Output:
{{
  "structured_facts": []
}}

### Example 7: QUESTION - Returns EMPTY (asking about past)
Input: "What alternatives did I consider before choosing Python?"

Output:
{{
  "structured_facts": []
}}

Today's date is {datetime.now().strftime("%Y-%m-%d")}.
Extract structured facts from the following conversation.
CRITICAL: If the input is a QUESTION (asking for info, not providing it), return {{"structured_facts": []}}.
Only extract from STATEMENTS that contain NEW information.
"""


# ----------------------------------------------------------------------
# User-only fact extraction (assistant turns ignored)
# ----------------------------------------------------------------------

USER_MEMORY_EXTRACTION_PROMPT = f"""You extract facts about a user from chat. Use the user's messages ONLY — ignore the assistant and system.

Cover the same ground as the general extractor: preferences, personal details, plans, activity preferences, wellness, professional, misc, and decision context.

Few-shot:

User: Hi.
Assistant: Hello! How can I help today?
Output: {{"facts": []}}

User: Hi, I'm looking for a restaurant in San Francisco.
Assistant: Sure! Any cuisine in mind?
Output: {{"facts": ["Looking for a restaurant in San Francisco"]}}

User: Hi, my name is John. I am a software engineer.
Assistant: Nice to meet you, John!
Output: {{"facts": ["Name is John", "Is a software engineer"]}}

Rules:
- Today is {datetime.now().strftime("%Y-%m-%d")}.
- Match the user's language.
- JSON shape: {{"facts": [strings]}}.

Conversation to extract from:
"""


# ----------------------------------------------------------------------
# Memory update decisions (ADD / UPDATE / DELETE / NONE)
# ----------------------------------------------------------------------

UPDATE_MEMORY_PROMPT = """You reconcile incoming facts against the existing memory bank.

For each incoming fact, choose exactly one action:

- ADD — new information, no existing entry covers it.
- UPDATE — existing entry is on the same topic but stale / partial. Keep the same id, supply old_memory for the changelog.
- DELETE — incoming fact contradicts an existing entry, making it wrong.
- NONE — already present or not worth storing.

Return JSON only:

{
    "memory": [
        {
            "id": "<id of the existing memory, or new id for ADD>",
            "text": "<content of the memory>",
            "event": "ADD | UPDATE | DELETE | NONE",
            "old_memory": "<previous content, only for UPDATE>"
        }
    ]
}
"""


# ----------------------------------------------------------------------
# Graph: extract entity-relation triples
# ----------------------------------------------------------------------

EXTRACT_RELATIONS_PROMPT = """
You build a knowledge graph from the provided entities and text.

Rules:
- Only state relationships that the text supports explicitly.
- Use "USER_ID" as the source entity for self-references ("I", "me", "my").
- Use timeless relationship types — "professor" not "became_professor".
- Keep entity names consistent across the response.
- Only relate entities the user explicitly mentioned.

Build the graph:
"""


# ----------------------------------------------------------------------
# Graph: decide which existing triples to evict
# ----------------------------------------------------------------------

DELETE_RELATIONS_PROMPT = """
You prune a graph of existing relationships given new information.

Delete only when the new information makes a relationship:
- Outdated or inaccurate (newer / more accurate).
- Contradictory (the new statement negates the old one).

Do NOT delete just because a similar relationship exists with a different destination — that is a different fact, not a contradiction.

Inputs you will receive:
1. Existing relationships (formatted as "source -- relationship -- destination").
2. New text to integrate.
3. A "USER_ID" string to substitute for self-references.

Prioritise recency. Delete only what the new information forces you to. Preserve semantic structure.

Return the deletion instructions:
"""


# ----------------------------------------------------------------------
# Builders
# ----------------------------------------------------------------------


def get_update_memory_prompt(
    existing_memories: list[dict[str, str]],
    new_facts: list[str],
) -> str:
    """Render the update-memory prompt with current memory + incoming facts."""
    if existing_memories:
        memory_part = f"""
Current memory:

```
{existing_memories}
```
"""
    else:
        memory_part = "\nCurrent memory is empty.\n"

    return f"""{UPDATE_MEMORY_PROMPT}

{memory_part}

New retrieved facts:

```
{new_facts}
```

Decide ADD / UPDATE / DELETE / NONE for each fact. JSON only.
"""


def get_fact_retrieval_messages(
    message: str, is_agent_memory: bool = False
) -> tuple[str, str]:
    """System + user prompts for the generic fact extractor."""
    if is_agent_memory:
        return FACT_RETRIEVAL_PROMPT, f"Input:\n{message}"
    return USER_MEMORY_EXTRACTION_PROMPT, f"Input:\n{message}"


def get_delete_messages(
    existing_memories: str, data: str, user_id: str
) -> tuple[str, str]:
    """System + user prompts for the graph pruner."""
    return (
        DELETE_RELATIONS_PROMPT.replace("USER_ID", user_id),
        f"Existing memories: {existing_memories}\n\nNew information: {data}",
    )


def get_structured_fact_messages(message: str) -> tuple[str, str]:
    """System + user prompts for the typed (decision/preference/plan) extractor."""
    return STRUCTURED_FACT_EXTRACTION_PROMPT, f"Input:\n{message}"