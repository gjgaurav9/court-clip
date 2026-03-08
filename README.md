# CourtClip

Badminton match annotation tool for frame-by-frame shot tagging. Desktop app built with Electron.

## Tech Stack

- **Frontend:** React 19, Tailwind CSS, Vite
- **Backend:** FastAPI, SQLAlchemy, Alembic (migrations)
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

### 2. Run setup (first time only)

```bash
./scripts/setup.sh
```

### 3. Start the app

```bash
./start.sh
```

This starts the backend, frontend dev server, and Electron window in one command. Press `Ctrl+C` to stop all processes.

After pulling new code, migrations run automatically on backend startup.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| Left / Right Arrow | Step back / forward one frame |
| Shift + Left / Right | Skip 30 frames |
| [ ] | Decrease / Increase speed |
| Enter | Mark segment start/end |
| Shift + Enter | Edit last label |
| Ctrl + Z | Undo |
| Ctrl + Shift + Z | Redo |
| ? | Show keyboard shortcut help |

## Project Structure

```
court-clip/
  backend/          # FastAPI server + Alembic migrations
  frontend/         # React + Vite app
  electron/         # Electron main process
  scripts/          # Setup and utility scripts
  start.sh          # Single command to start everything
```

## Building for Production

```bash
cd frontend && npm run build     # Build frontend assets
cd electron && npm run build     # Package Electron app
```
