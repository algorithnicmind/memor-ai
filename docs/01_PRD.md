# Product Requirements Document (PRD)

## 1. Product Vision
**Memorai** is not just a chatbot. It is an AI companion with persistent, structured memory that learns important information about a user, connects related concepts, remembers previous decisions and preferences, and uses that knowledge to provide personalized responses across conversations. It builds an evolving understanding of its user.

## 2. Problem Statement
Current AI chatbots lack persistent, long-term memory. If a user states a fact, preference, or project goal in one session, the AI forgets it by the next session. Users are forced to repeat context continuously (e.g., "I'm a CSE student using Python...").

## 3. Target Audience
- Developers, students, researchers, and general users who want a personalized AI companion that remembers their context, goals, and technical stack over long periods.

## 4. Key Features

### 4.1. Persistent Memory Extraction
- Automatically extract facts, preferences, goals, plans, decisions, entities, and relationships from user conversations without explicit commands.

### 4.2. Memory Management & Evolution
- **Conflict Resolution**: Identify when new information contradicts old information (e.g., switching from TensorFlow to PyTorch) and mark old data as superseded.
- **Importance Scoring**: Filter out noise. Only store high-value memories (importance/confidence scoring).
- **Duplicate Detection**: Avoid redundant memories by semantically merging similar facts.

### 4.3. Dual Retrieval System
- Retrieve context using both **Semantic/Vector Search** and **Graph Traversal** (Knowledge Graph) to find related concepts and explicit relationships.

### 4.4. Memory Dashboard
- A dedicated UI for users to view their AI's understanding of them.
- Displays categories: Profile, Goals, Skills, Preferences, Decisions, and a visual Knowledge Graph.
- Allows users to inspect, edit, or delete specific memories (e.g., "Forget everything about project X").

### 4.5. Memory Transparency
- Provide a "Why did you say that?" feature explaining which specific memories and graph relationships influenced the AI's response.

### 4.6. Offline / Local-First Mode
- Ability to run the entire stack (LLM, embeddings, databases) locally for privacy and offline usage, with an optional cloud mode for enhanced models.

## 5. Success Metrics
- **Memory Accuracy**: Percentage of correct facts recalled.
- **Retrieval Precision & Recall**: Relevance and completeness of fetched memories.
- **Conflict Resolution Rate**: Accuracy of deprecating outdated facts.
- **Token Efficiency**: Minimizing the size of the context window injected into the LLM.
