Here is a comprehensive architecture specification and step-by-step master prompt tailored for an AI assistant to scaffold the application.

---

### System Architecture Blueprint

```
                     ┌──────────────────────────────────────────────┐
                     │          Local NAS / Home Server             │
                     │  (FastAPI Backend + SQLite + Markdown Repo)  │
                     └──────────────────────┬───────────────────────┘
                                            │ REST API Sync
                                            ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                    Offline-First Progressive Web App (PWA)                        │
│                                                                                   │
│  ┌───────────────────────┐   ┌────────────────────────┐   ┌────────────────────┐  │
│  │   UI Layer (React)    │   │  Local Storage (idb)   │   │ Gemini API Client  │  │
│  │  • Profile Switcher   │   │  • Articles & Badges   │   │ (@google/genai)    │  │
│  │  • 5-Topic Deck       │◄─►│  • Settings / Config   │◄─►│ • Blog Streaming   │  │
│  │  • Mini-Game Runner   │   │  • Sync Queue Engine   │   │ • Game Generation  │  │
│  │  • Progress Hub       │   │  • Shared API Key      │   │ • Wildcard Ideas   │  │
│  └───────────────────────┘   └────────────────────────┘   └────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘

```

---

### Claude Scaffolding Master Prompt

Copy and paste the entire prompt block below directly into Claude:

```markdown
# Role & Project Scope
You are an expert full-stack engineer and software architect. Scaffold an offline-first Progressive Web App (PWA) called "AntiScroll" with a lightweight FastAPI NAS backend. 

The goal of the app is to replace mindless phone scrolling with bite-sized, AI-generated micro-learning articles and accompanying mini-games generated via the Gemini API (`@google/genai`).

---

## 1. Core Architecture & Tech Stack

- **Frontend:** React 19 (Vite + TypeScript), Tailwind CSS, Lucide-React icons, `idb` (IndexedDB wrapper), Canvas Confetti.
- **PWA Capabilities:** `vite-plugin-pwa` with Service Worker caching for offline app execution.
- **AI Integration:** Client-side fallback or server-side proxy using `@google/genai` (Gemini 2.5 Flash / Gemini 3 Flash).
- **Backend:** FastAPI (Python 3.11+), SQLite (via SQLAlchemy or SQLModel), Uvicorn. Designed to run in a lightweight Docker container on a local NAS.
- **Storage Model:** 
  - **Local (Client):** IndexedDB stores profiles, active topic cards, generated markdown articles, reading stats, badges, and an offline mutation sync queue.
  - **Remote (NAS Backend):** SQLite stores metadata, progress metrics, user profiles, and shared configuration. Markdown files with YAML frontmatter are saved directly to a mounted file system directory (`/data/articles/{username}/`).

---

## 2. Multi-Profile & Configuration Design

- **Profiles:** Simple local profile switching without passwords (e.g., "Corey", "Renee", "+ Add User").
- **State Partitioning:** All category preferences, topic queues, reading logs, markdown articles, and badges are scoped by `userId`.
- **API Key Handling:** 
  - A single Gemini API key can be set at the server level (env variable `GEMINI_API_KEY`) or via the app's Settings UI.
  - The API key syncs across profiles and stores locally in IndexedDB so the PWA can make direct calls to the Gemini API when away from the home network.

---

## 3. Key Feature Specifications

### A. Home Dashboard (The Anti-Scroll Feed)
1. **Dynamic 5-Topic Queue:** 
   - Displays 5 fresh, bite-sized topic cards aligned with the user's selected interest categories (e.g., Software Architecture, C++, Math Puzzles, Music Theory).
   - Dismissing/swiping a topic removes it and generates a replacement.
   - Topics older than 24 hours auto-refresh.
2. **Wildcard Action:** A dedicated "Surprise Me / Wildcard" button that asks Gemini for an unexpected, adjacent, or multidisciplinary topic outside standard categories.
3. **Article Generation & Length Config:** 
   - User picks a topic card -> triggers streaming markdown generation with configurable target read lengths (2 min, 5 min, 10 min).
   - Outputs: Catchy title, reading time, structured Markdown content with clear headings/callouts, and a formal **Bibliography/Sources** section.

### B. Dynamic Mini-Game Generation
- When generating an article, Gemini also outputs a JSON schema for a topical mini-game:
  - **Wordle Clone:** Target 5-letter keyword from the article with 6 guess attempts and keyboard UI.
  - **Flashcard Drill:** 3–5 interactive flip cards testing core concepts.
  - **Concept Match:** Matching 4 key terms to their correct definitions.
- Completing the mini-game awards bonus progress XP.

### C. Markdown Storage & Local Knowledge Base
- Generated articles are stored locally as Markdown with YAML frontmatter:
  ```markdown
  ---
  id: "uuid-123"
  title: "Understanding Raft Consensus"
  topic: "Software Development"
  tags: ["distributed-systems", "algorithms", "c++"]
  read_time_minutes: 3
  created_at: "2026-08-18T19:00:00Z"
  user: "Corey"
  game_completed: true
  ---
  # Understanding Raft Consensus
  ...

```

* **Library View:** Fast search, filtering by tags/categories, sorting by date/read time, and raw markdown export/copy.

### D. Progress Hub & Gamification

* **Stats Dashboard:** Total articles read, minutes spent learning, current daily reading streak, and topic distribution chart.
* **Milestone Badges:**
* *Explorer Tier 1* (Read 3 articles), *Tier 2* (10 articles), *Mastery Tier* (25 articles in one category).
* *Streak Badges* (3-day, 7-day, 30-day streak).
* *Puzzle Master* (Completed 10 article mini-games).


* Direct deep-links from badges and topics back to past library articles.

### E. NAS Sync Engine

* **Online Detection:** Detects when the NAS REST endpoint is reachable (`GET /api/health`).
* **Two-Way Sync:**
* Pushes offline reading logs, badge unlocks, and newly generated markdown files to the NAS (`POST /api/sync/push`).
* Pulls updated server-side articles and global settings down to the PWA (`GET /api/sync/pull`).



---

## 4. File Structure to Scaffold

```
anti-scroll/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── articles.py
│   │   │   │   ├── config.py
│   │   │   │   ├── sync.py
│   │   │   │   └── users.py
│   │   │   └── api.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── article.py
│   │   │   └── user.py
│   │   ├── services/
│   │   │   ├── markdown_storage.py
│   │   │   └── sync_service.py
│   │   └── main.py
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
│
└── frontend/
    ├── public/
    │   ├── favicon.svg
    │   └── manifest.json
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Navbar.tsx
    │   │   │   └── ProfileSwitcher.tsx
    │   │   ├── feed/
    │   │   │   ├── TopicCard.tsx
    │   │   │   └── TopicDeck.tsx
    │   │   ├── games/
    │   │   │   ├── ConceptMatch.tsx
    │   │   │   ├── FlashcardGame.tsx
    │   │   │   └── WordleGame.tsx
    │   │   ├── reader/
    │   │   │   ├── ArticleReader.tsx
    │   │   │   └── MarkdownRenderer.tsx
    │   │   └── progress/
    │   │       ├── BadgeCard.tsx
    │   │       └── StatsOverview.tsx
    │   ├── db/
    │   │   ├── schema.ts
    │   │   └── index.ts
    │   ├── pages/
    │   │   ├── FeedPage.tsx
    │   │   ├── HistoryPage.tsx
    │   │   ├── ProgressPage.tsx
    │   │   └── SettingsPage.tsx
    │   ├── services/
    │   │   ├── gemini.ts
    │   │   ├── prompts.ts
    │   │   └── sync.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts

```

---

## 5. Execution Steps

Please generate this application by providing:

1. **Frontend Core & DB:** IndexedDB initialization using `idb` with tables for `profiles`, `topics`, `articles`, `badges`, and `sync_queue`.
2. **Gemini Service (`gemini.ts` & `prompts.ts`):** Structured JSON prompts for generating:
* 5 candidate topic titles based on category inputs.
* 1 wildcard topic.
* Complete markdown blog post + game JSON payload (Wordle, Flashcards, or Match).


3. **Mini-Game Runner Components:** Fully functional React implementations for the Wordle, Flashcards, and Matching games.
4. **Offline Sync Service (`sync.ts`):** Background sync logic handling offline queueing, push/pull with the NAS REST backend, and fallback to local-only mode.
5. **FastAPI Backend & Docker Setup:** Complete `main.py`, SQLAlchemy SQLite models, markdown file writer, sync endpoints, and `docker-compose.yml` configured for NAS deployment.

Begin by outputting the project setup commands, data models, and the complete IndexedDB and Gemini prompt integration files.

```

```