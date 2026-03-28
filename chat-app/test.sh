#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RED='\033[31m'; GREEN='\033[32m'; BOLD='\033[1m'; RESET='\033[0m'

echo -e "${BOLD}═══ Chat App Test Suite ═══${RESET}"
FAIL=0

# 1. Backend unit tests
echo -e "\n${BOLD}▶ Backend Tests (pytest)${RESET}"
cd "$SCRIPT_DIR/backend"
if python -m pytest tests/ -v --tb=short; then
    echo -e "${GREEN}Backend: PASS${RESET}"
else
    echo -e "${RED}Backend: FAIL${RESET}"; FAIL=1
fi

# 2. Frontend unit tests
echo -e "\n${BOLD}▶ Frontend Tests (vitest)${RESET}"
cd "$SCRIPT_DIR/frontend"
if npx vitest run --reporter=verbose; then
    echo -e "${GREEN}Frontend: PASS${RESET}"
else
    echo -e "${RED}Frontend: FAIL${RESET}"; FAIL=1
fi

# 3. E2E integration (only if backend is running)
echo -e "\n${BOLD}▶ E2E Integration Tests${RESET}"
if curl -s http://localhost:8000/api/health | grep -q ok; then
    cd "$SCRIPT_DIR"
    if python test_e2e.py; then
        echo -e "${GREEN}E2E: PASS${RESET}"
    else
        echo -e "${RED}E2E: FAIL${RESET}"; FAIL=1
    fi
else
    echo "  ⚠ Backend not running, skipping E2E (start with ./start.sh first)"
fi

# Summary
echo -e "\n${BOLD}═══════════════════════════${RESET}"
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}${BOLD}ALL TEST SUITES PASSED${RESET}"
else
    echo -e "${RED}${BOLD}SOME SUITES FAILED${RESET}"; exit 1
fi
