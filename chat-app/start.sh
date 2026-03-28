#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start backend
echo "Starting backend..."
cd "$SCRIPT_DIR/backend"
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment .venv..."
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd "$SCRIPT_DIR/frontend"
pnpm install --silent
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "Chat App is running:"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:8000"
echo "  Storybook: run 'cd frontend && pnpm storybook' separately"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
