# AntiScroll — Claude Architecture Plan

> **Author:** Claude (Opus 4.6)
> **Date:** 2026-08-18
> **Status:** Draft — Awaiting Review

---

## Executive Summary

AntiScroll replaces mindless phone scrolling with bite-sized, AI-generated micro-learning articles and mini-games. This plan refines the initial plan with opinionated decisions on phasing, architectural trade-offs, and implementation priorities.

**Key differences from the initial plan:**
- **Phase-gated delivery** — ship a working local-only PWA first, add NAS sync later
- **Server-side Gemini only** — never store API keys on the client; proxy all AI calls through the backend
- **SQLite via `better-sqlite3` on the backend, Dexie.js on the client** — simpler ergonomics than raw `idb` and SQLAlchemy
- **Preact + Vite instead of React 19** — smaller bundle for a PWA that lives on a phone home screen
- **Game engine abstraction** — a single `<GameRunner>` component that renders any game type from a unified JSON schema, making it trivial to add new game types later

---

## 1. Guiding Principles

| Principle | Rationale |
|---|---|
| **Offline-first, sync-second** | The app must be fully usable on a phone with no network. NAS sync is a nice-to-have enhancement. |
| **AI calls are server-proxied** | Keeping the API key on the server simplifies key rotation, prevents client-side leaks, and allows rate-limiting per profile. |
| **Convention over configuration** | Minimize settings surfaces. Sensible defaults (5-min read length, auto-refresh at 24h) with overrides only when users ask. |
| **Ship incrementally** | Each phase produces a deployable artifact. No "big bang" launches. |
| **Content is portable** | All generated articles are Markdown+YAML frontmatter files. Users own their knowledge base — it's just a folder of `.md` files. |

---

## 2. Revised Tech Stack

### Frontend
| Layer | Choice | Why |
|---|---|---|
| Framework | **Preact 10 + Preact Signals** | ~3 KB gzipped vs ~40 KB for React. Signals eliminate most re-render boilerplate. Compatible with the React ecosystem via `preact/compat`. |
| Build | **Vite 6 + TypeScript 5.5** | Fast HMR, native ESM, tree-shaking. |
| Styling | **Vanilla CSS + CSS Custom Properties** | No Tailwind build step. CSS layers for specificity control. Container queries for responsive cards. |
| Local DB | **Dexie.js 4** | Promise-based IndexedDB wrapper with live queries, compound indexes, and a migration system. Far more ergonomic than raw `idb`. |
| PWA | **vite-plugin-pwa** (Workbox) | Precache app shell, runtime-cache API responses with stale-while-revalidate. |
| Markdown | **marked + DOMPurify** | Render article markdown safely. |
| Icons | **Lucide (tree-shaken imports)** | Only bundle the icons actually used. |
| Animations | **CSS @keyframes + View Transitions API** | No animation library needed. The View Transitions API handles page-level transitions natively. |

### Backend
| Layer | Choice | Why |
|---|---|---|
| Framework | **FastAPI 0.115+** (Python 3.12) | Async-native, auto-generated OpenAPI docs, dependency injection. |
| Database | **SQLite via SQLModel** | SQLModel gives Pydantic models + SQLAlchemy ORM in one class. Perfect for a single-server NAS app. |
| AI SDK | **`google-genai` Python SDK** | Server-side only. Streaming responses via SSE to the frontend. |
| File Storage | **Flat Markdown files** on disk at `/data/articles/{username}/` | Browsable, git-friendly, exportable. |
| Deployment | **Docker Compose** | Single `docker-compose.yml` with `backend` + `caddy` (reverse proxy + static file serving for the PWA). |

---

## 3. Data Models

### 3A. Client-Side (Dexie.js / IndexedDB)

```typescript
// db/schema.ts

interface Profile {
  id: string;           // uuid
  name: string;
  avatarEmoji: string;  // e.g. "🧑‍💻"
  categories: string[]; // selected interest categories
  readLengthMinutes: number; // default 5
  createdAt: Date;
}

interface TopicCard {
  id: string;           // uuid
  profileId: string;
  title: string;
  subtitle: string;     // one-line hook
  category: string;
  isWildcard: boolean;
  generatedAt: Date;
  expiresAt: Date;      // generatedAt + 24h
  status: 'pending' | 'reading' | 'dismissed' | 'completed';
}

interface Article {
  id: string;           // uuid
  profileId: string;
  topicCardId: string;
  title: string;
  category: string;
  tags: string[];
  readTimeMinutes: number;
  markdownContent: string;
  yamlFrontmatter: string;
  gamePayload: GamePayload | null;
  gameCompleted: boolean;
  readAt: Date | null;
  createdAt: Date;
}

interface Badge {
  id: string;
  profileId: string;
  type: BadgeType;
  tier: number;
  unlockedAt: Date;
  linkedArticleId?: string;
}

interface SyncQueueEntry {
  id: string;           // auto-increment
  profileId: string;
  action: 'push_article' | 'push_stats' | 'push_badge';
  payload: any;
  createdAt: Date;
  retries: number;
}

// Game types
type GameType = 'wordle' | 'flashcard' | 'concept_match' | 'crossword' | 'word_search';

interface GamePayload {
  type: GameType;
  data: WordleGame | FlashcardGame | ConceptMatchGame | CrosswordGame | WordSearchGame;
}

interface WordleGame {
  targetWord: string;       // 5-letter keyword
  hint: string;
  maxAttempts: number;      // default 6
}

interface FlashcardGame {
  cards: { front: string; back: string }[];
}

interface ConceptMatchGame {
  pairs: { term: string; definition: string }[];
}

interface CrosswordGame {
  gridSize: { rows: number; cols: number };
  clues: {
    number: number;
    direction: 'across' | 'down';
    clue: string;
    answer: string;
    startRow: number;
    startCol: number;
  }[];
}

interface WordSearchGame {
  gridSize: number;         // e.g. 10x10 letter grid
  grid: string[][];         // 2D array of uppercase characters
  words: { word: string; hint: string }[];
}

type BadgeType =
  | 'explorer'        // articles read milestones
  | 'streak'          // daily streak milestones
  | 'puzzle_master'   // games completed milestones
  | 'category_master' // deep-dive in one category
  | 'wildcard_fan';   // wildcard articles read
```

### 3B. Server-Side (SQLModel / SQLite)

```python
# models/user.py
class User(SQLModel, table=True):
    id: str = Field(primary_key=True)      # matches client-side Profile.id
    name: str
    categories: str                         # JSON-encoded list
    created_at: datetime
    updated_at: datetime

# models/article.py
class ArticleMeta(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    title: str
    category: str
    tags: str                               # JSON-encoded list
    read_time_minutes: int
    game_type: str | None
    game_completed: bool = False
    read_at: datetime | None
    created_at: datetime
    file_path: str                          # relative path to .md file

# models/reading_log.py
class ReadingLog(SQLModel, table=True):
    id: int = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    article_id: str = Field(foreign_key="articlemeta.id")
    date: date
    minutes_spent: int
```

---

## 4. API Design

### Gemini Proxy (Server → Gemini)

| Endpoint | Method | Description |
|---|---|---|
| `/api/ai/topics` | `POST` | Generate 5 topic cards for a user's categories. Returns JSON array. |
| `/api/ai/wildcard` | `POST` | Generate 1 wildcard topic outside the user's categories. |
| `/api/ai/article` | `POST` | Stream a full markdown article + game JSON for a given topic. Returns SSE stream. |

### CRUD & Sync

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check — returns `{ "status": "ok" }`. |
| `/api/users` | `GET/POST` | List or create user profiles. |
| `/api/users/{id}` | `GET/PUT` | Get or update a profile. |
| `/api/articles/{user_id}` | `GET` | List article metadata for a user. Supports `?tag=`, `?category=`, `?sort=` query params. |
| `/api/articles/{user_id}/{id}` | `GET` | Get full article content (markdown body). |
| `/api/sync/push` | `POST` | Accept a batch of offline mutations (articles, stats, badges). Idempotent by UUID. |
| `/api/sync/pull` | `GET` | Return all data newer than `?since=` timestamp for a given user. |

---

## 5. Gemini Prompt Strategy

### Topic Generation Prompt
```
You are a micro-learning topic curator. Given the user's interest categories 
and their reading history summary, generate exactly 5 fresh topic ideas.

Each topic must be:
- Specific enough to write a focused 2–10 minute article about
- Surprising or non-obvious (avoid "Introduction to X" patterns)
- Actionable — the reader should learn something they can use

Output JSON: [{ "title": "...", "subtitle": "...", "category": "..." }, ...]
```

### Article Generation Prompt
```
Write a micro-learning article on: "{topic_title}"

Target reading time: {read_minutes} minutes (~{word_count} words).

Requirements:
1. Catchy title (may differ from the topic title)
2. Structured with clear ## headings
3. Use > callout blocks for key insights
4. Include at least one concrete example or code snippet if technical
5. End with a "## Sources" section listing 2–3 real, verifiable references

Additionally, generate a mini-game payload as a JSON code fence at the end:
- Pick ONE game type: "wordle", "flashcard", "concept_match", "crossword", or "word_search"
- The game content must directly test concepts from the article

Output the article as Markdown, followed by a ```game-json code fence.
```

---

## 6. Component Architecture

```
App
├── ProfileSwitcher          # Modal overlay, emoji avatar picker
├── Layout
│   ├── Navbar               # Bottom tab bar (Feed | Library | Progress | Settings)
│   └── <Router>
│       ├── FeedPage
│       │   ├── TopicDeck    # Swipeable 5-card stack
│       │   │   └── TopicCard
│       │   └── WildcardButton
│       ├── ReaderPage
│       │   ├── ArticleHeader
│       │   ├── MarkdownRenderer
│       │   └── GameRunner
│       │       ├── WordleGame
│       │       ├── FlashcardGame
│       │       ├── ConceptMatchGame
│       │       ├── CrosswordGame
│       │       └── WordSearchGame
│       ├── LibraryPage
│       │   ├── SearchBar
│       │   ├── FilterChips
│       │   └── ArticleListItem
│       ├── ProgressPage
│       │   ├── StatsOverview  # Cards: articles, minutes, streak
│       │   ├── StreakCalendar
│       │   └── BadgeGrid
│       │       └── BadgeCard
│       └── SettingsPage
│           ├── ReadLengthPicker
│           ├── CategorySelector
│           └── SyncStatus
└── SyncManager              # Background service, not rendered
```

---

## 7. Phased Delivery Plan

### Phase 1 — Local-Only PWA (MVP)
**Goal:** A working app on a phone home screen that generates articles and games with no backend.

> **Note:** In Phase 1, the Gemini API key is stored in IndexedDB as a temporary measure. This is acceptable because it's a personal device app, not a multi-tenant SaaS.

| Task | Details | Priority |
|---|---|---|
| Project scaffolding | Vite + Preact + TypeScript + PWA plugin | P0 |
| Design system | CSS custom properties, typography, color palette, card styles | P0 |
| Dexie DB setup | Schema, migrations, seed data | P0 |
| Profile system | Create/switch profiles, emoji avatars | P0 |
| Gemini service | Client-side `@google/genai` calls for topics + articles | P0 |
| Topic deck | 5-card display, dismiss/swipe, wildcard button | P0 |
| Article reader | Markdown rendering, reading time tracker | P0 |
| Game runner | Wordle, Flashcard, Concept Match, Crossword, and Word Search components | P1 |
| Library page | Search, filter, sort, markdown export | P1 |
| Progress page | Stats, streaks, badges | P1 |
| Settings page | API key input, read length, categories | P1 |
| PWA install | Manifest, icons, service worker, offline shell | P0 |

**Deliverable:** Installable PWA that works entirely offline after first load + API key entry.

### Phase 2 — FastAPI Backend + NAS Sync
**Goal:** Server-proxied AI calls and cross-device sync via a NAS-hosted backend.

| Task | Details | Priority |
|---|---|---|
| FastAPI scaffold | Project structure, SQLModel models, Alembic migrations | P0 |
| Gemini proxy endpoints | `/api/ai/topics`, `/api/ai/article` (SSE streaming) | P0 |
| Article storage | Write `.md` files to `/data/articles/{username}/` | P0 |
| Sync endpoints | `/api/sync/push`, `/api/sync/pull` with idempotent upserts | P1 |
| Docker Compose | Backend + Caddy reverse proxy serving the PWA static build | P1 |
| Client sync manager | Background sync with retry queue, online detection | P1 |
| Migrate AI calls | Frontend detects backend availability; routes AI calls through server when online, falls back to client-side when offline | P1 |

**Deliverable:** Docker Compose stack deployable to a Synology/Unraid/Proxmox NAS.

### Phase 3 — Polish & Delight
**Goal:** The touches that make the app feel premium.

| Task | Details |
|---|---|
| View Transitions API | Smooth page transitions, card-to-article expand animation |
| Haptic feedback | `navigator.vibrate()` on card swipe, game completion |
| Confetti | Canvas Confetti on badge unlock and game completion |
| Reading streak notifications | Optional scheduled notification via Notification API |
| Dark/light theme | System-preference detection + manual toggle |
| Onboarding flow | First-launch wizard: pick name, emoji, categories, API key |
| Performance audit | Lighthouse PWA + Performance scores >= 95 |

---

## 8. File Structure (Revised)

```
anti-scroll/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── ai.py          # /api/ai/* — Gemini proxy
│   │   │   │   ├── articles.py    # /api/articles/*
│   │   │   │   ├── sync.py        # /api/sync/*
│   │   │   │   └── users.py       # /api/users/*
│   │   │   └── router.py          # FastAPI APIRouter aggregation
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic Settings (env vars)
│   │   │   └── database.py        # SQLModel engine + session
│   │   ├── models/
│   │   │   ├── article.py
│   │   │   ├── reading_log.py
│   │   │   └── user.py
│   │   ├── services/
│   │   │   ├── gemini_service.py  # google-genai SDK wrapper
│   │   │   ├── markdown_store.py  # .md file read/write
│   │   │   └── sync_service.py    # push/pull logic
│   │   └── main.py                # FastAPI app factory
│   ├── alembic/                   # DB migrations
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── pyproject.toml             # uv/pip deps
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   ├── icons/                 # PWA icons (192, 512)
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── ProfileSwitcher.tsx
│   │   │   ├── feed/
│   │   │   │   ├── TopicCard.tsx
│   │   │   │   ├── TopicDeck.tsx
│   │   │   │   └── WildcardButton.tsx
│   │   │   ├── games/
│   │   │   │   ├── GameRunner.tsx  # Unified game dispatcher
│   │   │   │   ├── WordleGame.tsx
│   │   │   │   ├── FlashcardGame.tsx
│   │   │   │   ├── ConceptMatchGame.tsx
│   │   │   │   ├── CrosswordGame.tsx
│   │   │   │   └── WordSearchGame.tsx
│   │   │   ├── reader/
│   │   │   │   ├── ArticleReader.tsx
│   │   │   │   └── MarkdownRenderer.tsx
│   │   │   └── progress/
│   │   │       ├── BadgeCard.tsx
│   │   │       ├── BadgeGrid.tsx
│   │   │       ├── StatsOverview.tsx
│   │   │       └── StreakCalendar.tsx
│   │   ├── db/
│   │   │   ├── database.ts        # Dexie instance + schema
│   │   │   └── hooks.ts           # useLiveQuery wrappers
│   │   ├── pages/
│   │   │   ├── FeedPage.tsx
│   │   │   ├── LibraryPage.tsx
│   │   │   ├── ProgressPage.tsx
│   │   │   ├── ReaderPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── services/
│   │   │   ├── gemini.ts          # AI client (direct or proxied)
│   │   │   ├── prompts.ts         # Prompt templates
│   │   │   └── sync.ts            # Background sync manager
│   │   ├── styles/
│   │   │   ├── reset.css
│   │   │   ├── tokens.css         # CSS custom properties
│   │   │   └── components.css     # Shared component styles
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── badges.ts          # Badge evaluation logic
│   │   │   ├── reading-time.ts    # Word count → minutes
│   │   │   └── dates.ts           # Date helpers
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css              # Global styles + imports
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docs/
│   ├── initial_plan.md
│   └── claude_plan.md             # ← This file
│
└── README.md
```

---

## 9. Key Architectural Decisions

### Decision 1: Preact over React
React 19 is 40 KB+ gzipped. For a PWA that lives on a home screen and competes with native apps, bundle size matters. Preact is API-compatible via `preact/compat` and ships at ~3 KB. If we ever need a React-only library, the compat layer handles it transparently.

### Decision 2: Dexie.js over raw `idb`
The `idb` library is a thin promise wrapper. Dexie adds live queries (reactive UI updates when data changes), compound indexes, and a versioned migration system — all things we need for a multi-profile, offline-first app. The bundle cost is ~25 KB gzipped, well worth the DX improvement.

### Decision 3: Server-Side AI Proxy (Phase 2)
The initial plan allows storing the Gemini API key in IndexedDB for client-side calls. This is fine for Phase 1 (personal device), but Phase 2 moves to server-proxied calls because:
- Single key management point
- Rate limiting per profile
- Response caching (same topic → same article within a window)
- SSE streaming from server → client for progressive article rendering

### Decision 4: CSS over Tailwind
For a project of this size with a focused design system, vanilla CSS with custom properties is more maintainable, produces smaller output, and doesn't require a build-time scanning step. CSS container queries handle responsive card layouts more elegantly than breakpoint-based utility classes.

### Decision 5: Flat Markdown File Storage
Articles are stored as `.md` files with YAML frontmatter on disk, not in SQLite blobs. This means:
- Users can browse their knowledge base with any file manager or text editor
- Easy to back up, version control, or export
- The SQLite DB only stores metadata for fast queries; the source of truth is the filesystem

---

## 10. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Gemini API rate limits | Implement exponential backoff + local topic cache (serve cached topics when rate-limited). |
| Gemini generates bad game JSON | Validate game payloads against a Zod schema before rendering. Fall back to flashcard type if invalid. |
| Large IndexedDB usage | Cap stored articles at 500 per profile. Oldest auto-archive to NAS on sync. Show storage usage in Settings. |
| Offline for extended periods | The app is designed offline-first. Sync queue has no TTL — it will drain whenever connectivity resumes. |
| PWA install friction | Provide clear install prompts with `beforeinstallprompt` event. Show inline instructions for iOS (Add to Home Screen). |

---

## 11. Success Metrics

| Metric | Target |
|---|---|
| Lighthouse PWA Score | >= 95 |
| Lighthouse Performance Score | >= 90 |
| Time to Interactive (3G) | < 3 seconds |
| JS Bundle Size (gzipped) | < 80 KB |
| Article generation latency (P50) | < 4 seconds |
| Offline capability | Full app usable with cached data, no network required |

---

## Next Steps

1. **Review this plan** — identify any disagreements or missing requirements
2. **Scaffold Phase 1** — Vite + Preact project, design system, Dexie DB
3. **Build the feed loop** — Topic generation → Article reader → Game runner
4. **Ship to home screen** — PWA install, offline caching, first real usage
