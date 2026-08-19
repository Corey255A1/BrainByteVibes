# 🚀 AntiScroll

<p align="center">
  <img src="https://img.shields.io/badge/PWA-Offline--First-emerald?style=for-the-badge&logo=pwa" alt="PWA Offline First" />
  <img src="https://img.shields.io/badge/Stack-Preact%20%7C%20Vite%20%7C%20FastAPI-blue?style=for-the-badge" alt="Preact Vite FastAPI" />
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-purple?style=for-the-badge&logo=google" alt="Google Gemini API" />
  <img src="https://img.shields.io/badge/License-MIT-amber?style=for-the-badge" alt="MIT License" />
</p>

<h3 align="center">
  <b>Trade doom-scrolling for bite-sized micro-learning & AI-generated mini-games.</b>
</h3>

<p align="center">
  AntiScroll turns phone downtime into high-yield learning sessions. Instead of infinite social feeds, get 5 fresh, AI-curated micro-learning topics every day—complete with interactive mini-games, streak tracking, and self-hosted NAS sync.
</p>

---

## ✨ Features That Make Learning Addictive

### 📰 1. The 5-Topic Anti-Scroll Feed
- **Curated Queue:** 5 bite-sized topic cards refreshed daily based on your interest categories (e.g. *Software Architecture, C++, Math Puzzles, Music Theory, Quantum Physics*).
- **✨ Wildcard / "Surprise Me":** Instantly generate multidisciplinary, unexpected topics strictly outside your standard categories.
- **Configurable Read Lengths:** Pick 2-minute, 5-minute, or 10-minute target read durations.

### 🎮 2. Interactive AI Mini-Games
Every article dynamically generates a topical mini-game to reinforce retention and award XP:
- 🔤 **Wordle Keyword Drill:** Guess key technical terms in 6 attempts with virtual keyboard feedback.
- 🎴 **Flashcard Drills:** Interactive flip cards testing core article takeaways.
- 🧩 **Concept Match:** Pair key concepts to their exact definitions.
- ✏️ **Mini Crossword:** 5x5 grid crosswords auto-generated from article content.
- 🔍 **Word Search:** Find key terms hidden in an interactive letter grid.

### 📊 3. Gamification & Knowledge Hub
- **Personal Knowledge Base:** Full-text search, category chips, raw Markdown export, and YAML frontmatter storage.
- **Analytics Dashboard:** Minutes spent learning, total articles read, 14-day activity heatmap, and active daily streaks.
- **Milestone Badges:** Unlock achievements for streak consistency, category mastery, and puzzle completions.

### 🤖 4. Dynamic Gemini Model Selector
- Query and select any supported Google Gemini model directly in Settings.
- Visual cost-tier indicators (💲 **Ultra-Fast/Cheapest**, 💲💲 **Balanced**, 💲💲💲 **High Performance/Reasoning**).

### 🏠 5. Offline-First PWA + Local NAS Sync
- **Client Storage:** IndexedDB (`Dexie.js`) stores profiles, topics, articles, and mutation queues locally on your phone.
- **Self-Hosted NAS Backend:** Lightweight FastAPI + SQLite backend stores markdown files directly on disk at `/data/articles/{username}/`. Deploy anywhere with Docker Compose!

---

## 🏗 System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │          Local NAS / Home Server             │
                    │  (FastAPI Backend + SQLite + Markdown Repo)  │
                    └──────────────────────┬───────────────────────┘
                                           │ REST API Sync (/api/sync)
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                    Offline-First Progressive Web App (PWA)                        │
│                                                                                   │
│  ┌───────────────────────┐   ┌────────────────────────┐   ┌────────────────────┐  │
│  │   UI Layer (Preact)   │   │  Local Storage (Dexie) │   │ Gemini API Client  │  │
│  │  • Profile Switcher   │   │  • Articles & Badges   │   │  (@google/genai)   │  │
│  │  • 5-Topic Deck       │◄─►│  • Settings & Model    │◄─►│ • Article Stream   │  │
│  │  • 5 Mini-Game Types  │   │  • Sync Queue Engine   │   │ • Game Generation  │  │
│  │  • Analytics & Streaks│   │  • API Key Storage     │   │ • Model Listing    │  │
│  └───────────────────────┘   └────────────────────────┘   └────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### Option A: One-Command Launch (Recommended)

Run the included `start.sh` script to build the PWA, set up the Python virtual environment, and start both backend and frontend servers:

```bash
./start.sh
```

- **Frontend PWA:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://localhost:8000](http://localhost:8000)
- **Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install .
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run preview -- --port 5173
```

---

### Option C: Docker Compose (NAS Deployment)

Deploy to your Synology, Unraid, Proxmox, or home server:

```bash
docker-compose up -d
```

---

## 🛠 Tech Stack

- **Frontend:** Preact 10, Vite 6, TypeScript, Tailwind CSS v4, `vite-plugin-pwa`, `Dexie.js`, `marked`, `DOMPurify`, `canvas-confetti`, `lucide-react`.
- **Backend:** FastAPI, Python 3.11+, SQLModel, SQLite, `google-genai` SDK, Uvicorn, Docker Compose.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
