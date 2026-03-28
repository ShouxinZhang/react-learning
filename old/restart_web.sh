#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"

BACKEND_PORT="${BACKEND_PORT:-5000}"
FRONTEND_PORT="${FRONTEND_PORT:-3201}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:${BACKEND_PORT}}"

# 默认开启检查
SKIP_CHECK=false
if [[ "$1" == "--skip-check" ]]; then
  SKIP_CHECK=true
  echo "⏩ 跳过自检模式已开启"
fi

# 执行检查逻辑
if [ "$SKIP_CHECK" = false ]; then
  echo "--- 🔍 启动前全量自检 ---"
  
  echo "1. 检查后端逻辑..."
  python services/api-python/test_logic.py || { echo "❌ 后端逻辑测试失败，取消启动！"; exit 1; }
  
  echo -e "\n2. 静态类型检查 (Frontend TypeScript)..."
  cd "$DIR/frontend" && npx tsc -p tsconfig.app.json --noEmit && npx tsc -p tsconfig.node.json --noEmit || { echo "❌ TypeScript 检查未通过，取消启动！"; exit 1; }
  
  echo -e "\n3. 静态代码规范检查 (Frontend Lint)..."
  npm run lint || echo "⚠️ 注意：发现代码规范警告，建议修复。"
  
  echo -e "\n✅ 自检圆满通过！正在为您启动服务..."
  cd "$DIR"
fi

# 杀掉旧进程
echo "--- ♻️ 重启服务 ---"
lsof -ti:${FRONTEND_PORT} | xargs -r kill -9
lsof -ti:${BACKEND_PORT} | xargs -r kill -9

# 启动 Python 后端
cd "$DIR/services/api-python"
python -m pip install -r requirements.txt -q
PORT="${BACKEND_PORT}" python server.py &
echo "✅ 后端已在后台启动 (Port ${BACKEND_PORT})"

# 启动 React 前端
echo "🚀 正在启动前端服务 (Port ${FRONTEND_PORT})..."
cd "$DIR/frontend"
VITE_API_BASE_URL="${VITE_API_BASE_URL}" npm run dev -- --port "${FRONTEND_PORT}"
