Here is the comprehensive User Requirements Document (URD) and functional specification for the **AntiScroll** progressive web app and NAS ecosystem.

---

# AntiScroll — Product & User Requirements Document (PRD/URD)

## 1. System Overview & Objectives

**AntiScroll** is an offline-first micro-learning progressive web application designed to replace reflexive social media scrolling with structured, bite-sized knowledge acquisition. It features dynamic article generation, topical mini-games, markdown-based progress archiving, and a local synchronization bridge to a home Network Attached Storage (NAS) server.

---

## 2. User Profiles & Multi-User Experience

### 2.1 Profile Management (Frictionless / No-Auth)

* **UR-1.1:** The app must support multiple local user profiles (e.g., *Corey*, *Renee*, or newly created users) selectable from a header or top-level UI switch.
* **UR-1.2:** Switching profiles must not require passwords, PINs, or cloud authentication tokens.
* **UR-1.3:** Each user profile must maintain an isolated data partition for:
* Selected interest categories and custom topics.
* Active 5-topic feed queue and topic history.
* Generated Markdown articles and read timestamps.
* Reading stats, streaks, and milestone badges.
* User-specific configuration (e.g., target article read length).



### 2.2 Shared Configuration & Global Key Management

* **UR-1.4:** The system must maintain a single, shared Gemini API key accessible across all profiles on the same client and server instance.
* **UR-1.5:** If an API key is entered in the frontend settings on any profile, it must update the global client store and sync to the backend.
* **UR-1.6:** If an API key is passed as an environment variable to the NAS backend (`GEMINI_API_KEY`), the server must provide it to connected clients upon initial handshake/sync.

---

## 3. Feed & Topic Discovery Engine

### 3.1 Dynamic Topic Deck

* **UR-2.1:** The Home Feed must present an active deck of exactly **5 bite-sized topic suggestions** generated from the active profile’s configured categories.
* **UR-2.2:** Each topic card must show a concise title, category pill, estimated read time, and a brief 1-sentence teaser.
* **UR-2.3:** Users must be able to dismiss/swipe away any topic card, prompting immediate generation or backfill of a single replacement topic.
* **UR-2.4:** Topics remaining unread in the feed for greater than 24 hours must auto-expire and cycle with fresh topics upon app launch or refresh.

### 3.2 On-Demand Wildcard Trigger

* **UR-2.5:** The home interface must provide a prominent, dedicated **"Wildcard / Surprise Me"** button.
* **UR-2.6:** Triggering the Wildcard button must query Gemini to produce an unexpected, adjacent, or cross-disciplinary concept outside the user's primary selected categories (e.g., bridging mechanical engineering with biology).
* **UR-2.7:** The wildcard result must offer the option to read immediately or swap into the current 5-topic queue.

---

## 4. Content Generation & Mini-Game Engine

### 4.1 Article Generation

* **UR-3.1:** Selecting a topic card must trigger streaming Markdown generation using the Gemini API (client-side directly when away from home; via NAS backend proxy when local).
* **UR-3.2:** The generation prompt must adhere to user-configured read length settings:
* **Quick Read:** ~300 words (~2 minutes)
* **Standard:** ~600 words (~5 minutes)
* **Deep Dive:** ~1,200 words (~10 minutes)


* **UR-3.3:** Generated articles must be structured with Markdown headings, concise summaries, callouts/bullet points, and a mandatory **Sources & Further Reading / Citations** section.

### 4.2 Integrated Dynamic Mini-Games

* **UR-3.4:** Alongside the article Markdown, Gemini must generate structured JSON for a contextual mini-game directly testing the article's core concepts.
* **UR-3.5:** Supported game templates must include:
1. **Wordle Clone:** 5-letter keyword extraction with 6-guess interactive grid and on-screen keyboard.
2. **Flashcard Drill:** 3 to 5 interactive flip-cards with front term / question and back definition / explanation.
3. **Concept Matching:** 4 term-to-definition drag-and-drop or tap-to-match puzzle.


* **UR-3.6:** Successful completion of a mini-game must update the article record (`game_completed: true`) and award bonus progress XP.

---

## 5. Storage, Archiving & Markdown Repository

### 5.1 Local Client Storage (IndexedDB)

* **UR-4.1:** The PWA must store all active user data locally in IndexedDB (`idb`) to guarantee full offline functionality.
* **UR-4.2:** Articles must be stored with structured YAML frontmatter:
```markdown
---
id: "uuid-v4"
user: "Corey"
title: "Memory Arenas in Embedded C++"
category: "Software Development"
tags: ["c++", "memory-management", "embedded"]
read_time_minutes: 3
created_at: "2026-08-18T19:30:00Z"
game_completed: true
synced: false
---

```



### 5.2 NAS File System Storage

* **UR-4.3:** When synced to the NAS backend, each article must be written to disk as a raw `.md` file inside user-partitioned directories:
`/data/articles/{username}/{category}/{slug}.md`
* **UR-4.4:** Articles saved on the NAS must remain human-readable and compatible with standard Markdown/PKM tools (e.g., Obsidian, Logseq, VS Code).

---

## 6. Library, Search & History Explorer

* **UR-5.1:** A dedicated **Library / History Page** must list all previously generated and read articles for the active user profile.
* **UR-5.2:** Users must be able to:
* Real-time full-text search across titles, content, and tags.
* Filter articles by category, tag, completion status, and date range.
* Sort by newest, oldest, or shortest/longest read time.


* **UR-5.3:** Clicking an article opens the full Markdown reader with the ability to re-play the generated mini-game or copy the raw Markdown to the clipboard.

---

## 7. Progress Hub, Analytics & Gamification

* **UR-6.1:** A dedicated **Progress Hub** must display:
* Total articles completed.
* Total learning time accrued (in minutes/hours).
* Daily reading streak counter (days active consecutively).
* Visual category breakdown (distribution of topics learned).


* **UR-6.2:** The badge system must track and unlock visual milestone achievements:
* **Volume Milestones:** *Curious Mind* (3 articles), *Avid Scholar* (10 articles), *Knowledge Archon* (50 articles).
* **Category Mastery:** *Domain Specialist* (10+ articles in a single category).
* **Streak Milestones:** *3-Day Spark*, *7-Day Flame*, *30-Day Forge*.
* **Puzzle Champion:** Complete 5, 15, and 30 article mini-games.


* **UR-6.3:** Tapping a badge or category stat must deep-link directly to the filtered Library view displaying the qualifying articles.

---

## 8. Network Synchronization & Offline Architecture

### 8.1 Offline-First Execution Mode

* **UR-7.1:** The PWA must remain fully operational when disconnected from the home network.
* **UR-7.2:** When offline from the NAS:
* The app uses the client-stored Gemini API key to make direct HTTPS calls to Google Gemini.
* New articles, reading logs, and badge events are committed to IndexedDB and queued in an internal `sync_queue` table.



### 8.2 NAS Bridge & Two-Way Sync

* **UR-7.3:** The PWA must periodically ping the NAS REST endpoint (`GET /api/health`).
* **UR-7.4:** Upon detecting NAS connectivity:
* **Push:** The client flushes the `sync_queue`, uploading new Markdown files, reading metrics, and profile changes to the NAS (`POST /api/sync/push`).
* **Pull:** The client fetches any updates made from other devices or the server (`GET /api/sync/pull`).


* **UR-7.5:** Conflict resolution must follow a *last-write-wins* strategy based on ISO timestamps, ensuring local offline creations are never overwritten.

---

## 9. Settings & Administration

* **UR-8.1:** The **Settings Page** must allow users to:
* Manage interest categories (add, edit, toggle, remove).
* Configure default article length (2 min, 5 min, 10 min).
* View and update the shared Gemini API Key.
* Configure the NAS backend base URL (e.g., `[http://192.168.1.100:8000](http://192.168.1.100:8000)` or custom local domain).
* Check connection status and trigger a manual "Sync Now" action.
* Export all local data to a backup JSON archive or clear local cache.