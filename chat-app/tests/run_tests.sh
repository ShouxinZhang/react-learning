#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

echo "🧪 Running all tests..."
echo ""

# ── Backend unit tests ──
echo "📦 Backend pytest..."
cd "$BACKEND_DIR"
python -m pytest tests/ -v --tb=short 2>&1 | tail -40
BACKEND_EXIT=${PIPESTATUS[0]}

# ── Frontend unit tests ──
echo ""
echo "📦 Frontend vitest..."
cd "$FRONTEND_DIR"
pnpm test 2>&1 | tail -30
FRONTEND_EXIT=${PIPESTATUS[0]}

# ── E2E tests ──
echo ""
echo "🌐 E2E integration tests..."
cd "$BACKEND_DIR"
rm -f chat_e2e_test.db

# Start backend with test DB
DATABASE_URL="sqlite+aiosqlite:///./chat_e2e_test.db" uvicorn server:app --host 0.0.0.0 --port 8001 &
E2E_PID=$!
sleep 3

pip install -q requests websockets
python "$SCRIPT_DIR/e2e_test.py" --base-url http://localhost:8001
E2E_EXIT=$?

kill $E2E_PID 2>/dev/null
rm -f chat_e2e_test.db

echo ""
echo "============================="
echo "Backend pytest:  $([ $BACKEND_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Frontend vitest: $([ $FRONTEND_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "E2E tests:       $([ $E2E_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "============================="

exit $(( BACKEND_EXIT + FRONTEND_EXIT + E2E_EXIT ))
