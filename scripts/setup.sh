#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== CourtClip Setup ==="
echo ""

# Backend dependencies
echo "[1/3] Installing backend dependencies..."
cd "$ROOT_DIR/backend"
pip install -r requirements.txt
echo ""

# Frontend dependencies + build
echo "[2/3] Installing frontend dependencies and building..."
cd "$ROOT_DIR/frontend"
npm install
npm run build
echo ""

# Electron dependencies
echo "[3/3] Installing Electron dependencies..."
cd "$ROOT_DIR/electron"
npm install
echo ""

echo "=== Setup complete! ==="
echo ""
echo "To run the desktop app (dev mode):"
echo "  1. Copy .env.example to .env and add your DATABASE_URL"
echo "  2. cd backend && uvicorn main:app --reload"
echo "  3. cd frontend && npm run dev"
echo "  4. cd electron && npm run dev"
echo ""
echo "To run the web version only:"
echo "  1. cd backend && uvicorn main:app --reload"
echo "  2. cd frontend && npm run dev"
echo "  3. Open http://localhost:5173"
