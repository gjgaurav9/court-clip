#!/bin/bash
set -e

# Load env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Starting CourtClip..."

# Start backend
echo "[1/3] Starting backend..."
cd backend
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend
echo "Waiting for backend..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo "Backend ready!"
    break
  fi
  sleep 1
done

# Start frontend dev server
echo "[2/3] Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for Vite
sleep 3

# Start Electron
echo "[3/3] Starting Electron..."
cd electron
NODE_ENV=development npx electron . &
ELECTRON_PID=$!
cd ..

echo ""
echo "CourtClip is running!"
echo "  Backend:  http://127.0.0.1:8000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all processes"

# Cleanup on exit
cleanup() {
  echo "Shutting down..."
  kill $ELECTRON_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  kill $BACKEND_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait
