# Phase 1 — 脚手架

## 概览

| 项 | 值 |
|---|---|
| 前置依赖 | 无 (首个 Phase) |
| Subagent 数 | 2 (并行) |
| Main Agent 任务 | 创建顶层目录 + start.sh → 派发 → 验收 |

---

## Step 0 — Main Agent 前置

创建 `chat-app/` 顶层目录和 `start.sh`。

---

## Step 1 — 并行派发

### Subagent A: 前端脚手架

**职责**: 在 `chat-app/frontend/` 下搭建完整前端工程

**产物清单**:
| 文件 | 要点 |
|---|---|
| `package.json` | react 19, vite 7, storybook 8, zustand, react-router-dom 7, typescript |
| `vite.config.ts` | port 5173, react plugin |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | 标准 Vite 三件套 |
| `index.html` | 入口 HTML |
| `.storybook/main.ts` | framework: react-vite, stories glob |
| `.storybook/preview.ts` | 全局 CSS 导入, viewport addon |
| `src/main.tsx` | ReactDOM.createRoot |
| `src/App.tsx` | BrowserRouter 占位 |
| `src/index.css` | 微信配色 CSS 变量 (`--wechat-green: #07C160` 等), 全局 reset |
| `src/App.css` | 布局: 左右分栏 |
| `src/types/user.ts` | `User`, `OnlineStatus` 类型 |
| `src/types/chat.ts` | `Chat`, `ChatType` 类型 |
| `src/types/message.ts` | `Message`, `MessageType` 类型 |
| `src/types/index.ts` | 统一 re-export |

**关键决策**:
- 包管理器: pnpm
- CSS: CSS Modules + 全局变量 (不引 tailwind/antd)
- Storybook addons: `@storybook/addon-essentials`

---

### Subagent B: 后端脚手架

**职责**: 在 `chat-app/backend/` 下搭建 FastAPI + SQLite 工程

**产物清单**:
| 文件 | 要点 |
|---|---|
| `requirements.txt` | fastapi, uvicorn[standard], sqlalchemy[asyncio], aiosqlite, python-jose[cryptography], passlib[bcrypt], pydantic |
| `server.py` | FastAPI app, CORS 中间件, lifespan 中初始化 DB, 挂载路由占位, port 8000 |
| `database.py` | async engine (`sqlite+aiosqlite:///./chat.db`), async sessionmaker, `init_db()` 建表 |
| `models.py` | SQLAlchemy ORM: `User`, `Chat`, `ChatMember`, `Message` 四模型, 参照 PLAN.md 表结构 |
| `schemas.py` | Pydantic: `UserCreate`, `UserOut`, `ChatOut`, `MessageOut` 等 DTO |
| `auth.py` | `hash_password()`, `verify_password()`, `create_token()`, `get_current_user()` 占位 |
| `routes/__init__.py` | 空文件 |
| `routes/auth_routes.py` | 占位 router |
| `routes/chat_routes.py` | 占位 router |
| `routes/message_routes.py` | 占位 router |
| `routes/user_routes.py` | 占位 router |
| `websocket/__init__.py` | 空文件 |
| `websocket/manager.py` | `ConnectionManager` 类骨架 |
| `websocket/handler.py` | WS endpoint 占位 |

**关键决策**:
- SQLite WAL mode 启用 (并发读优化)
- `chat.db` 加入 `.gitignore`

---

## Step 2 — Main Agent 验收

### 门禁检查

```bash
# 前端
cd chat-app/frontend
pnpm install
pnpm dev          # 应能在 :5173 看到页面 → Ctrl+C
pnpm storybook    # 应能在 :6006 打开 Storybook → Ctrl+C

# 后端
cd chat-app/backend
pip install -r requirements.txt
python -c "from server import app; print('FastAPI OK')"
python -c "import asyncio; from database import init_db; asyncio.run(init_db()); print('DB OK')"
```

**全部通过 → Phase 1 ✅ → 进入 Phase 2**
