# Product Requirements Document (PRD)

## 1. Product Vision
**Memorai** is an AI companion with persistent, structured memory that learns important information about a user. It builds an evolving understanding of its user.

*“Talk to me once, and I'll remember forever.”*

## 2. Problem Statement
Current AI chatbots suffer from **Context Amnesia**. Users are forced to repeat context constantly. 

## 3. Key Features & Innovations

### 3.1. Production-Level User Flow
- **Animated Landing Page**: A premium, animated landing page featuring an About section and Contact section.
- **Authentication**: Secure Login and Registration (Sign Up) using User ID and Password.
- **ChatGPT-Style Interface**:
  - **Center**: Main chat area.
  - **Sidebar (Left)**: "New Chat" button and "Chat History".
  - **History Management**: 3-dot menu on past chats to Rename, Share, or Delete the chat.
  - **User Profile & Settings**: Personalization settings, Help Center (Terms of Service, Privacy Policy), and Logout.

### 3.2. Rich Interactions
- **Multi-Modal Uploads**: A `+` (Plus) icon in the chat input for sharing files, images, and documents with the AI.
- **Voice Input**: Users can provide prompts via voice commands.
- **Live Voice Chat**: A real-time, live voice conversation mode to speak directly with the AI, similar to ChatGPT's voice mode.

### 3.3. Structured Memory & Dual Retrieval
Combines two powerful memory systems:
1. **Vector Memory ("What is similar?")**: Semantic similarity via an OpenAI-SDK-compatible embedder (Mistral `mistral-embed`, 1024-dim by default) and **SQLite** vector storage managed by Tortoise ORM.
2. **Knowledge Graph ("How are things connected?")**: Entity relationships via a **Ladybug** embedded graph database (Cypher surface, in-process).

### 3.4. Memory & Personalization Transparency
- **Absolute Transparency**: The UI must clearly show the user *what memory data* was retrieved to generate the response. This is a critical feature to build trust.

## 4. Software Architecture Principles
- **SOLID Principles**: Codebase must adhere strictly to SOLID principles to maintain extensibility.
- **Microservices-Inspired Modularity**: Backend will be split into highly decoupled domains (Auth, Memory Engine, Chat Inference) with clean interfaces.
- **Clean Code**: Strict typing, comprehensive error handling, and separation of concerns.

## 5. Future Roadmap
- **Progressive Web App (PWA) & Offline Mode** (Postponed for future release)
- **Multi-User Memory Sharing**: Collaborative AI.
- **Memory Analytics**: Visualizing the knowledge graph.
- **Agent Mode**: AI acts on user's behalf with context.
