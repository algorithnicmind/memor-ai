# Wireframes

## 1. Chat Interface with Memory Panel

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ MEMORAI                                                       👤 Rahul  │
├─────────────────┬───────────────────────────────────┬───────────────────┤
│                 │                                   │                   │
│  Conversations  │            Chat Area              │    🧠 Memories    │
│                 │                                   │                   │
│  + New Chat     │ User: What should I learn?        │  Profile          │
│                 │                                   │  • CSE student    │
│  History        │ AI: Based on your goals and       │                   │
│  • ML Project   │     your existing Python skills,  │  Goals            │
│  • React bugs   │     I'd suggest...                │  • Become ML eng  │
│  • Rust intro   │                                   │                   │
│                 │                                   │  Preferences      │
│                 │                                   │  • Prefers Python │
│                 │                                   │                   │
│                 │ [ Type your message...        ]   │  Projects         │
│                 │                                   │  • Rec. system    │
│                 │ 🧠 3 memories used                │                   │
│                 │ 🔗 4 relationships found          │                   │
└─────────────────┴───────────────────────────────────┴───────────────────┘
```

## 2. Memory Dashboard (Dedicated View)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ MEMORAI | Dashboard                                           👤 Rahul  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MY MEMORY                                                 [Export]     │
│  ──────────────────────────────────────────────────────────────────     │
│                                                                         │
│  👤 PROFILE                             🎯 GOALS                        │
│  Name: Rahul      [Edit]                • Learn Machine Learning [x]    │
│  Education: CSE   [Edit]                • Build AI project       [x]    │
│                                                                         │
│  💻 SKILLS                              ❤️ PREFERENCES                  │
│  • Python         [x]                   • Python                 [x]    │
│  • FastAPI        [x]                   • Local AI               [x]    │
│                                                                         │
│  📋 DECISIONS                           🔗 KNOWLEDGE GRAPH              │
│  • Chose PyTorch                        (Visual interactive node graph) │
│    Reason: Team familiarity [x]           [User] -> [Building] -> [App] │
│                                                                         │
│                                                                         │
│  ⚠️ DANGER ZONE                                                         │
│  [ Forget Entire Project Category ]  [ Wipe All Memory ]                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3. Transparency Modal ("Why did you say that?")

```text
┌───────────────────────────────────────────────┐
│ Memory Context Used                           │
├───────────────────────────────────────────────┤
│ This response was influenced by:              │
│                                               │
│ 🧠 Memory: "You prefer Python"                │
│    Source: Conversation #18                   │
│    Importance: 0.94                           │
│                                               │
│ 🔗 Relationship:                              │
│    Python → used_for → Machine Learning       │
│                                               │
│                                   [ Close ]   │
└───────────────────────────────────────────────┘
```
