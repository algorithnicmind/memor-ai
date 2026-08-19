# Wireframes

## 1. Animated Landing Page & Auth

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ MEMORAI                                   [Home] [About] [Contact]      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   (Animated 3D Brain / Particles)                                       │
│                                                                         │
│   AN AI THAT ACTUALLY REMEMBERS YOU.                                    │
│                                                                         │
│   [ Register / Sign Up ]      [ Login ]                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Main Chat Interface (ChatGPT-Style)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ MEMORAI                                                       👤 Rahul  │
├─────────────────┬───────────────────────────────────────────────────────┤
│ 📝 + New Chat   │                                                       │
│ ────────────────│  User: What should I learn?                           │
│ Chat History    │                                                       │
│                 │  AI: Based on your goals and Python skills, I'd       │
│ • ML Project  ⋮ │      suggest...                                       │
│   ├ Rename      │                                                       │
│   ├ Share       │  [ ℹ️ Personalization Info: Used 3 memories ]         │
│   └ Delete      │                                                       │
│                 │                                                       │
│ • React bugs  ⋮ │                                                       │
│                 │                                                       │
│ ────────────────│                                                       │
│ ⚙️ Settings     │                                                       │
│ 👤 Profile      │  [ ➕ ] [ 🎤 ] [ Type your message...         ] [ 📞 ]│
│ ❓ Help Center  │   ↑      ↑                                        ↑   │
│ 🚪 Logout       │  Files Voice Input                          Live Voice│
└─────────────────┴───────────────────────────────────────────────────────┘
```

## 3. Help Center & Settings Modal

```text
┌───────────────────────────────────────────────┐
│ Help & Settings                               │
├───────────────────────────────────────────────┤
│                                               │
│  [ Privacy Policy ]                           │
│  [ Terms of Service ]                         │
│                                               │
│  Personalization Data:                        │
│  • See what the AI knows about you            │
│  • Manage what data is saved                  │
│                                               │
│                                   [ Close ]   │
└───────────────────────────────────────────────┘
```





new one:

MEMORAI — Updated Wireframe Specification
1. Overall User Flow

The application should have two different entry experiences.

New user
Open Memorai
      ↓
Memorai Logo / Welcome Screen
      ↓
Sign In / Sign Up
      ↓
Create Account / Login
      ↓
Main Chat Dashboard
Returning user
Open Memorai
      ↓
Authentication/session check
      ↓
Already logged in?
      ↓
YES
      ↓
Main Chat Dashboard

The user should not have to log in again every time if a valid session exists.

2. Welcome / Landing Screen

This is the first screen shown to a new visitor.

Wireframe
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                         🧠                                   │
│                       MEMORAI                                │
│                                                              │
│              Your AI that remembers.                         │
│                                                              │
│       Personalized conversations powered by memory.          │
│                                                              │
│                 [ Sign In ]   [ Sign Up ]                    │
│                                                              │
│                                                              │
│       Your conversations. Your memory. Your AI.              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
Elements
Memorai logo
Memorai name
Short tagline
Sign In button
Sign Up button
Optional short description
Important

Don't make this page overly complicated.

The purpose is simply:

Introduce Memorai → authenticate the user → enter the chatbot.

3. Sign Up Screen

For a completely new user.

┌───────────────────────────────────────────────┐
│                                               │
│                    🧠                         │
│                  MEMORAI                      │
│                                               │
│              Create your account              │
│                                               │
│  Name                                         │
│  [____________________________]               │
│                                               │
│  Email                                        │
│  [____________________________]               │
│                                               │
│  Password                                     │
│  [____________________________]               │
│                                               │
│  Confirm Password                             │
│  [____________________________]               │
│                                               │
│             [ Create Account ]                │
│                                               │
│        Already have an account?               │
│                 Sign In                       │
│                                               │
└───────────────────────────────────────────────┘
Backend connection

This corresponds to your existing:

User
├── id
├── email
├── password_hash
└── created_at
4. Sign In Screen
┌───────────────────────────────────────────────┐
│                                               │
│                    🧠                         │
│                  MEMORAI                      │
│                                               │
│                 Welcome back                  │
│                                               │
│  Email                                        │
│  [____________________________]               │
│                                               │
│  Password                                     │
│  [____________________________]               │
│                                               │
│             [ Sign In ]                       │
│                                               │
│              Forgot Password?                 │
│                                               │
│       Don't have an account? Sign Up          │
│                                               │
└───────────────────────────────────────────────┘
5. Main Chat Dashboard

This is the most important wireframe.

The structure should feel familiar to users of modern AI chat applications.

┌─────────────────────────────────────────────────────────────────────────────┐
│ MEMORAI                                             Search 🔍    👤 Profile │
├───────────────┬───────────────────────────────────────────────┬─────────────┤
│               │                                               │             │
│  + New Chat   │              Conversation Area               │   🧠 Memory  │
│               │                                               │             │
│  🔍 Search    │                                               │   Profile   │
│               │          User message                         │   • CSE     │
│  Projects     │          ───────────                          │             │
│  📁 My Project│                                               │   Goals     │
│               │          Memorai response                     │   • AI/ML   │
│  Chats        │          ───────────────                      │             │
│               │                                               │   Skills    │
│  Today        │                                               │   • Python  │
│  • Chat 1     │                                               │             │
│  • Chat 2     │                                               │             │
│               │                                               │             │
│  Yesterday     │                                               │             │
│  • Chat 3     │                                               │             │
│               │                                               │             │
│               │                                               │             │
│  📌 Pinned    │                                               │             │
│  • Important  │                                               │             │
│               │                                               │             │
│               │                                               │             │
│               │ [ Ask Memorai anything...             ]  ➤    │             │
│               │                                               │             │
├───────────────┴───────────────────────────────────────────────┴─────────────┤
│  ⚙ Settings    👤 Account                                                   │
└─────────────────────────────────────────────────────────────────────────────┘

This keeps the chat experience simple, while the right-side Memory panel exposes what makes Memorai different.

6. Left Sidebar

The sidebar should contain the user's navigation and conversation organization.

Top section
🧠 MEMORAI


+ New Chat


🔍 Search
New Chat

Clicking this should:

Current conversation
        ↓
Save conversation
        ↓
Create new conversation
        ↓
Empty chat screen
7. Projects

Add a Projects section.

PROJECTS


📁 AI/ML Project
📁 College
📁 Internship
📁 Personal
      +
   New Project

A project should act as an organizational container for conversations.

For example:

📁 AI/ML Project


    ├── Machine Learning Roadmap
    ├── PyTorch Discussion
    ├── Recommendation System
    └── Dataset Questions
New Project

Button:

+ New Project

Modal:

┌────────────────────────────────────────┐
│ Create New Project                     │
│                                        │
│ Project Name                           │
│ [________________________]             │
│                                        │
│ Description                            │
│ [________________________]             │
│                                        │
│              [Cancel] [Create]         │
└────────────────────────────────────────┘
8. Chat History

The sidebar should automatically organize previous conversations.

Example:

TODAY


• Build AI project
• Python error
• Machine Learning roadmap




YESTERDAY


• React project
• Internship discussion




PREVIOUS 7 DAYS


• Database design
• FastAPI questions
• College project

Each conversation should have a three-dot menu.

Chat Name                    ⋮

Clicking it opens:

┌─────────────────────┐
│ ✏ Rename            │
│ 📌 Pin              │
│ 📁 Move to Project  │
│ 🔗 Share            │
│ 🗑 Delete            │
└─────────────────────┘
9. Rename Chat

The user should be able to rename automatically generated chat titles.

Example:

Before:
"New Chat"


After:
"Machine Learning Roadmap"

Wireframe:

┌─────────────────────────────────┐
│ Rename Conversation             │
│                                 │
│ [ Machine Learning Roadmap ]    │
│                                 │
│       [Cancel] [Save]           │
└─────────────────────────────────┘
10. Pin Chat

The user can pin important conversations.

Example:

📌 PINNED


📌 AI/ML Career Roadmap
📌 Memorai Project
📌 Internship Tasks

Pinned conversations remain easily accessible above normal history.

11. Share Chat

A user can share a conversation.

┌─────────────────────────────────────────┐
│ Share Conversation                      │
│                                         │
│ Anyone with this link can view          │
│ this conversation.                      │
│                                         │
│ [ https://memorai/... ]                 │
│                                         │
│             [ Copy Link ]               │
│                                         │
│              [ Close ]                  │
└─────────────────────────────────────────┘
Important privacy consideration

Because Memorai contains personal memories, sharing a chat should not automatically expose the user's entire memory database.

Only the selected conversation should be shared.

12. Search Conversations

Add search at the top of the sidebar.

🔍 Search conversations

When clicked:

┌─────────────────────────────────────────┐
│ 🔍 Search conversations                 │
│                                         │
│ machine learning                       │
│                                         │
│ Results                                 │
│                                         │
│ • Machine Learning Roadmap              │
│ • Recommendation System                 │
│ • PyTorch Discussion                    │
└─────────────────────────────────────────┘

Search should be able to search:

Conversation titles
Message content
Projects

You can later extend it to search memories as well.

13. Chat Screen

The center area remains intentionally simple.

┌─────────────────────────────────────────────────────┐
│                                                     │
│                    MEMORAI                          │
│                                                     │
│              How can I help you today?              │
│                                                     │
│                                                     │
│        ┌─────────────────────────────────┐          │
│        │ Ask anything...                 │          │
│        │                                 │          │
│        │                          🎤 ➤   │          │
│        └─────────────────────────────────┘          │
│                                                     │
└─────────────────────────────────────────────────────┘
Suggested starter prompts
"Help me plan my AI/ML roadmap"


"Remember my project requirements"


"Explain this concept simply"


"Help me organize my goals"

These are only UI suggestions; they aren't separate core features.

14. During Conversation

Example:

┌─────────────────────────────────────────────────────┐
│ User                                               │
│                                                     │
│ I want to build a recommendation system using      │
│ Python.                                             │
│                                                     │
│                                                     │
│ Memorai                                             │
│                                                     │
│ That's a good fit for your AI/ML goals. We can     │
│ start by designing the dataset and model...        │
│                                                     │
│ 🧠 2 memories used                                 │
│ 🔗 3 relationships found                           │
│                                                     │
└─────────────────────────────────────────────────────┘

This is where Memorai visibly differentiates itself from an ordinary chatbot.

15. Memory Indicator

At the bottom of an AI response:

🧠 3 memories used
🔗 4 relationships found

Clicking it can open the memory details.

Example:

┌──────────────────────────────────────────────┐
│ Memory Context Used                          │
│                                              │
│ 🧠 You are learning AI/ML                    │
│    Importance: 0.92                           │
│                                              │
│ 🧠 You prefer Python                         │
│    Importance: 0.94                           │
│                                              │
│ 🔗 Python → used_for → Machine Learning      │
│                                              │
│              [ View Memory ]                 │
└──────────────────────────────────────────────┘
16. Right Memory Panel

This is one of Memorai's biggest differentiators.

┌──────────────────────────┐
│ 🧠 MEMORY                │
├──────────────────────────┤
│                          │
│ PROFILE                  │
│ • CSE Student            │
│                          │
│ GOALS                    │
│ • Become AI/ML Engineer  │
│                          │
│ SKILLS                   │
│ • Python                 │
│ • React                  │
│                          │
│ PREFERENCES              │
│ • Prefers simple         │
│   explanations           │
│                          │
│ PROJECTS                 │
│ • Recommendation System  │
│                          │
│ DECISIONS                │
│ • Using PyTorch          │
│                          │
│ [View All Memories]      │
└──────────────────────────┘
17. Memory Dashboard

Keep your existing dashboard, but connect it to the new chatbot navigation.

Sidebar:

🧠 Memorai


+ New Chat
🔍 Search


Projects
Chats


────────────


🧠 Memory Dashboard
⚙ Settings
👤 Profile

Dashboard:

┌──────────────────────────────────────────────────────────────────┐
│ MEMORAI / MEMORY DASHBOARD                         👤 Profile   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ MY MEMORY                                                        │
│                                                                  │
│ ┌──────────────────┐ ┌──────────────────┐                        │
│ │ 👤 PROFILE       │ │ 🎯 GOALS         │                        │
│ │                  │ │                  │                        │
│ │ CSE Student      │ │ Learn AI/ML      │                        │
│ │                  │ │ Become ML Eng.   │                        │
│ │ [Edit]           │ │ [Edit]           │                        │
│ └──────────────────┘ └──────────────────┘                        │
│                                                                  │
│ ┌──────────────────┐ ┌──────────────────┐                        │
│ │ 💻 SKILLS        │ │ ❤️ PREFERENCES   │                        │
│ │                  │ │                  │                        │
│ │ Python           │ │ Local AI         │                        │
│ │ FastAPI          │ │ Python           │                        │
│ │                  │ │                  │                        │
│ └──────────────────┘ └──────────────────┘                        │
│                                                                  │
│ ┌──────────────────┐ ┌─────────────────────────────────────────┐ │
│ │ 📋 DECISIONS     │ │ 🔗 KNOWLEDGE GRAPH                      │ │
│ │                  │ │                                         │ │
│ │ PyTorch          │ │      User                               │ │
│ │                  │ │        ↓                                │ │
│ │ [Edit]           │ │  Recommendation System                  │ │
│ └──────────────────┘ │        ↓                                │ │
│                       │      PyTorch                            │ │
│                       └─────────────────────────────────────────┘ │
│                                                                  │
│ ⚠ DANGER ZONE                                                   │
│ [Forget Category]       [Wipe All Memory]                       │
└──────────────────────────────────────────────────────────────────┘
18. Profile Menu

Top-right:

👤 Rahul ▾

Click:

┌──────────────────────┐
│ 👤 Profile           │
│ 🧠 Memory            │
│ ⚙ Settings           │
│                       │
│ 🚪 Log Out            │
└──────────────────────┘
19. Profile Page
┌───────────────────────────────────────────────┐
│ Profile                                       │
│                                               │
│              👤                               │
│                                               │
│ Name                                          │
│ [ Rahul __________________ ]                  │
│                                               │
│ Email                                         │
│ [ rahul@email.com ________ ]                  │
│                                               │
│ Account Created                               │
│ August 2026                                   │
│                                               │
│ [ Save Changes ]                              │
│                                               │
│ Security                                      │
│ [ Change Password ]                           │
│                                               │
│                 [ Log Out ]                   │
└───────────────────────────────────────────────┘
20. Settings

Keep settings simple initially.

SETTINGS


Appearance
○ Light
○ Dark
○ System


AI Mode
○ Local
○ Cloud


Memory
☑ Enable automatic memory
☑ Show memory indicators


Privacy
☑ Local processing


Notifications
☑ Chat notifications

The exact settings can evolve during implementation.

21. Mobile/Responsive Wireframe

You should also mention responsive behavior in the wireframe document.

On desktop:

Sidebar | Chat | Memory Panel

On mobile:

┌──────────────────────────┐
│ ☰  MEMORAI       👤      │
├──────────────────────────┤
│                          │
│       Chat Area          │
│                          │
│                          │
│                          │
│                          │
│                          │
│ [ Ask anything... ]  ➤   │
└──────────────────────────┘

The sidebar and memory panel become drawer/modal panels instead of remaining permanently visible.

22. Complete Navigation Structure

I recommend putting this directly into your wireframe document:

MEMORAI
│
├── Welcome
│   ├── Sign In
│   └── Sign Up
│
├── Chat Application
│   │
│   ├── New Chat
│   │
│   ├── Search
│   │
│   ├── Projects
│   │   ├── Create Project
│   │   ├── Rename Project
│   │   └── Delete Project
│   │
│   ├── Chat History
│   │   ├── Rename Chat
│   │   ├── Pin Chat
│   │   ├── Move to Project
│   │   ├── Share Chat
│   │   └── Delete Chat
│   │
│   ├── Memory Panel
│   │
│   └── Chat
│
├── Memory Dashboard
│   ├── Profile Memories
│   ├── Goals
│   ├── Skills
│   ├── Preferences
│   ├── Decisions
│   ├── Projects
│   ├── Memory Timeline
│   ├── Knowledge Graph
│   ├── Edit Memory
│   ├── Delete Memory
│   ├── Forget Category
│   └── Wipe Memory
│
├── Profile
│   ├── Account
│   ├── Security
│   └── Logout
│
└── Settings
    ├── Appearance
    ├── AI Mode
    ├── Memory Settings
    ├── Privacy
    └── Notifications
23. What You Should NOT Add

Since you specifically said you don't want a huge ChatGPT clone, don't unnecessarily add things such as:

Voice/video calling
Complex agent marketplace
Hundreds of GPTs
Huge plugin marketplace
Complicated team collaboration
Enterprise administration
Payment/subscription system
Massive model-selection UI
Unnecessary social features

The goal is:

ChatGPT-like usability + Memorai's persistent memory system.

24. The Final Wireframe Architecture

Your complete UI can therefore be represented as:

                         MEMORAI
                            │
                 ┌──────────┴──────────┐
                 │                     │
             New User             Returning User
                 │                     │
                 ▼                     ▼
            Welcome/Auth          Session Check
                 │                     │
          ┌──────┴──────┐              │
          │             │              │
       Sign Up       Sign In           │
          │             │              │
          └──────┬──────┘              │
                 │                     │
                 └──────────┬──────────┘
                            ▼
                    MAIN CHAT DASHBOARD
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
     Sidebar             Chat Area          Memory Panel
        │                   │                   │
   ┌────┼────┐              │              Memories
   │    │    │              │              Relationships
   ▼    ▼    ▼              │
 New  Search Projects        │
 Chat                         │
        │                     │
        ▼                     ▼
    Chat History          AI Response
        │                     │
   ┌────┼────────┐            │
   │    │        │            ▼
 Rename Pin    Share       Memory Used
   │    │        │            │
   └────┴────────┘            ▼
                         Why did you say that?