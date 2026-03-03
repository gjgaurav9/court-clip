# CourtClip

Tennis match annotation tool for frame-by-frame shot tagging. Available as an Electron desktop app (for best video playback performance) and as a web app (Vercel + Render).

## Tech Stack

- **Frontend:** React 19, Tailwind CSS, Vite
- **Backend:** FastAPI, SQLAlchemy
- **Database:** Neon PostgreSQL (cloud) / SQLite (local fallback)
- **Desktop:** Electron

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (or use SQLite locally)

### 1. Clone and configure

```bash
git clone <repo-url> && cd court-clip
cp .env.example .env
# Edit .env and add your DATABASE_URL
```

### 2. Run setup

```bash
./scripts/setup.sh
```

### 3a. Desktop app (Electron)

```bash
# Terminal 1 — backend
cd backend && uvicorn main:app --reload

# Terminal 2 — frontend dev server
cd frontend && npm run dev

# Terminal 3 — Electron window
cd electron && npm run dev
```

### 3b. Web app only

```bash
# Terminal 1 — backend
cd backend && uvicorn main:app --reload

# Terminal 2 — frontend
cd frontend && npm run dev
# Open http://localhost:5173
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| Left / Right Arrow | Step back / forward one frame |
| Shift + Left / Right | Jump 5 seconds |
| 1-9 | Set playback speed (1x-3x) |

## Project Structure

```
court-clip/
  backend/          # FastAPI server
  frontend/         # React + Vite app
  electron/         # Electron main process
  scripts/          # Setup and utility scripts
```

## Building for Production

```bash
cd frontend && npm run build     # Build frontend assets
cd electron && npm run build     # Package Electron app
```
