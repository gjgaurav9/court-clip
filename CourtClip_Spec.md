# CourtClip — Badminton Video Annotation Tool

## Overview

CourtClip is a web-based video annotation tool for badminton match analysis. It allows a team of annotators to load match videos, scrub through frame-by-frame, segment clips by rally/shot, and label each shot with structured metadata. All annotations are saved to a shared database and exportable as CSV for ML model training.

This is an internal tool for a team of 7 people building an AI Sports Coach.

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** SQLite (via SQLAlchemy)
- **Deployment:** Vercel (frontend) + Render (backend)
- **No paid services required**

---

## Core Features

### 1. Video Player with Frame-Level Controls

- Load video from local file (browser file picker, plays client-side only — video is NOT uploaded to server)
- Display current frame number and timestamp
- Keyboard shortcuts:
  - `Space` — Play/Pause
  - `ArrowRight` — Next frame
  - `ArrowLeft` — Previous frame
  - `Shift + ArrowRight` — Skip 10 frames forward
  - `Shift + ArrowLeft` — Skip 10 frames back
- Show video FPS and total frame count
- Frame-accurate seeking (use `video.currentTime = frameNumber / fps`)

### 2. Clip Segmentation

- Press `Enter` to mark a segment boundary
  - First `Enter` = mark Frame Start
  - Second `Enter` = mark Frame End → creates a segment
- Visual indicator showing "Marking start..." after first Enter
- Timeline bar below the video showing all segmented clips as colored blocks
- Click on any segment in the timeline to jump to it

### 3. Shot Labeling (Shift + Enter to open label form)

After a segment is created, press `Shift + Enter` to label it. A form appears with:

**User Input Fields:**

| Field | Type | Options |
|-------|------|---------|
| Rally Number | Number input | Auto-increments, user can change |
| Player ID | Dropdown | Player 1, Player 2 |
| Shot Type | Dropdown | Short Serve, Long Serve, Toss, Lift, Dribble, Smash, Jump Smash, Tab, Block, Drive, Low Drop, High Drop, Netkill |
| Backhand | Toggle (boolean) | Yes / No |
| Around Head | Toggle (boolean) | Yes / No |
| Hit Area | Clickable Court Grid | 16 zones (4x4 grid on a badminton half-court diagram) |

**Auto-Calculated Fields:**

| Field | Logic |
|-------|-------|
| Shot Number | Previous shot + 1. Resets to 1 when Rally Number changes |
| Frame Start | From segment marking |
| Frame End | From segment marking |
| Duration (sec) | (Frame End - Frame Start) / FPS |

### 4. Annotation Table

- Below the video, show a table of all annotations for the current video
- Columns: Shot #, Rally #, Player, Shot Type, Backhand, Around Head, Hit Area, Frame Start, Frame End
- Click any row to jump to that segment in the video
- Edit button on each row to modify annotation
- Delete button with confirmation

### 5. Undo/Redo

- `Ctrl + Z` — Undo last action (segment creation or label)
- Maintain an action history stack

### 6. Export

- "Export CSV" button — downloads all annotations as CSV
- CSV columns: `video_name, rally_number, shot_number, player_id, shot_type, backhand, around_hand, hit_area, frame_start, frame_end, duration_sec`
- "Export JSON" button — same data as JSON (useful for direct model training)

### 7. Project/Session Management

- Create a "project" (e.g., "Badminton Singles Match 1")
- Each project holds one video + its annotations
- Project list on home page
- Auto-save annotations (save to backend on every label action)

---

## API Endpoints (FastAPI Backend)

```
# Projects
POST   /api/projects                    — Create new project
GET    /api/projects                    — List all projects
GET    /api/projects/{id}               — Get project details
DELETE /api/projects/{id}               — Delete project and its annotations

# Annotations
POST   /api/projects/{id}/annotations   — Create annotation
GET    /api/projects/{id}/annotations   — Get all annotations for a project
PUT    /api/annotations/{id}            — Update annotation
DELETE /api/annotations/{id}            — Delete annotation

# Export
GET    /api/projects/{id}/export?format=csv   — Export as CSV
GET    /api/projects/{id}/export?format=json  — Export as JSON

# Health
GET    /api/health                      — Health check
```

---

## Database Schema (SQLite)

```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    video_filename TEXT NOT NULL,
    video_fps REAL DEFAULT 30.0,
    total_frames INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    rally_number INTEGER NOT NULL,
    shot_number INTEGER NOT NULL,
    player_id TEXT NOT NULL,          -- "Player 1" or "Player 2"
    shot_type TEXT NOT NULL,          -- One of the 13 shot types
    backhand BOOLEAN DEFAULT FALSE,
    around_hand BOOLEAN DEFAULT FALSE,
    hit_area INTEGER,                 -- 1-16 (court zone)
    frame_start INTEGER NOT NULL,
    frame_end INTEGER NOT NULL,
    duration_sec REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  CourtClip — Badminton Video Annotation Tool            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────┐  ┌────────────┐  │
│  │                                   │  │  LABELING   │  │
│  │          VIDEO PLAYER             │  │   FORM      │  │
│  │                                   │  │             │  │
│  │                                   │  │ Rally: [2]  │  │
│  │                                   │  │ Player: [▼] │  │
│  │                                   │  │ Shot:  [▼]  │  │
│  │                                   │  │ BH: [  ]    │  │
│  │                                   │  │ AH: [  ]    │  │
│  │                                   │  │             │  │
│  │    Frame: 342 / 18000             │  │ ┌──┬──┬──┬─┐│  │
│  │    Time:  00:11.40                │  │ │ 1│ 2│ 3│4││  │
│  └───────────────────────────────────┘  │ ├──┼──┼──┼─┤│  │
│  ┌───────────────────────────────────┐  │ │ 5│ 6│ 7│8││  │
│  │ ▓▓▓░░░▓▓░░░░░▓▓▓▓░░░░░▓▓░░░░░░░ │  │ ├──┼──┼──┼─┤│  │
│  │         TIMELINE BAR              │  │ │ 9│10│11│C││  │
│  └───────────────────────────────────┘  │ ├──┼──┼──┼─┤│  │
│                                         │ │13│14│15│G││  │
│  ┌───────────────────────────────────┐  │ └──┴──┴──┴─┘│  │
│  │  # │ Rally │ Player │ Shot │ ...  │  │  [Save]     │  │
│  │  1 │   1   │  P1    │ Serve│ ...  │  └────────────┘  │
│  │  2 │   1   │  P2    │ Lift │ ...  │                  │
│  │  3 │   1   │  P1    │ Smash│ ...  │  [Export CSV]    │
│  │  4 │   2   │  P2    │ Serve│ ...  │  [Export JSON]   │
│  └───────────────────────────────────┘                  │
│                                                         │
│  Shortcuts: Space=Play/Pause │ ←→=Frame │ Enter=Segment │
│  Shift+←→=Skip10 │ Shift+Enter=Label │ Ctrl+Z=Undo     │
└─────────────────────────────────────────────────────────┘
```

---

## Court Grid for Hit Area Selection

The hit area is a 4x4 grid (16 zones) representing one half of the badminton court from the player's perspective. Display a simple SVG badminton half-court with 16 clickable zones:

```
        Net Side
   ┌───┬───┬───┬───┐
   │ 1 │ 2 │ 3 │ 4 │  Front court (near net)
   ├───┼───┼───┼───┤
   │ 5 │ 6 │ 7 │ 8 │  Mid court front
   ├───┼───┼───┼───┤
   │ 9 │10 │11 │12 │  Mid court back
   ├───┼───┼───┼───┤
   │13 │14 │15 │16 │  Back court (near baseline)
   └───┴───┴───┴───┘
      Baseline Side
```

- Clicking a zone highlights it and sets the `hit_area` value
- Show court lines (service line, center line) for reference

---

## Development Phases

### Phase 1 — Frontend Only (Day 1-3)
Build the React app that works fully client-side:
- Video player with all keyboard shortcuts
- Segment marking (Enter key)
- Labeling form with all fields
- Annotation table
- Export CSV (from in-memory state)
- Store everything in React state — no backend needed yet
- This phase alone is usable by the team immediately

### Phase 2 — Backend Integration (Day 4-5)
- Set up FastAPI with SQLite
- Create all API endpoints
- Connect React frontend to backend
- Auto-save annotations on every action

### Phase 3 — Polish (Day 6-7)
- Undo/redo functionality
- Timeline visualization
- Better court grid SVG
- Error handling and edge cases
- Deploy to Vercel + Render

---

## Important Notes

- **Videos stay local** — they are loaded from the user's machine via file picker. They are never uploaded to the server. This saves storage costs and bandwidth. Only the annotation metadata goes to the backend.
- **Frame accuracy** — Use `video.requestVideoFrameCallback()` for precise frame tracking, or calculate frame from `currentTime * fps`.
- **Auto-save** — Every annotation create/update/delete should auto-save to backend. No "Save" button for the overall session.
- **Multi-user** — Multiple annotators can work on different projects simultaneously. No real-time collaboration needed within the same video (not Google Docs style).
- **Shot types are specific to badminton** — but design the schema so sport and shot types can be configured later for tennis, table tennis, etc.

---

## Shot Type Reference (for annotators)

| Shot Type | Description |
|-----------|-------------|
| Short Serve | Low serve that barely clears the net, lands near service line |
| Long Serve | High serve to the back of the court |
| Toss | Underhand shot to push shuttle high and deep |
| Lift | Defensive shot sending shuttle high to the back |
| Dribble | Gentle net shot that barely crosses the net |
| Smash | Powerful downward overhead shot |
| Jump Smash | Smash executed while jumping |
| Tab | Quick flat push shot at the net |
| Block | Defensive return of a smash, soft touch |
| Drive | Fast flat shot parallel to the ground |
| Low Drop | Deceptive shot clearing net by small margin, lands near net |
| High Drop | Drop shot landing in midcourt or sidelines |
| Netkill | Aggressive downward shot played right at the net |

---

## Git Repo Structure

```
courtclip/
├── README.md
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── VideoPlayer.jsx
│       │   ├── Timeline.jsx
│       │   ├── LabelForm.jsx
│       │   ├── CourtGrid.jsx
│       │   ├── AnnotationTable.jsx
│       │   └── ProjectList.jsx
│       ├── hooks/
│       │   ├── useVideoControls.js
│       │   ├── useKeyboardShortcuts.js
│       │   └── useAnnotations.js
│       ├── api/
│       │   └── client.js
│       └── utils/
│           └── export.js
├── backend/
│   ├── requirements.txt
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   └── routers/
│       ├── projects.py
│       └── annotations.py
├── .gitignore
└── docker-compose.yml (optional, for local dev)
```

---

## Getting Started (for Claude Code)

1. Start with Phase 1 — build the frontend-only version first
2. Use Vite + React + Tailwind CSS
3. Make sure all keyboard shortcuts work with the video player
4. The court grid should be an SVG component with clickable zones
5. Test with any MP4 video file
6. Phase 1 should be fully functional without any backend — store everything in React state and export from memory
