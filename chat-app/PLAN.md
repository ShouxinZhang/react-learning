# Chat App — 主计划

> 类微信 Web Chat · `chat-app/` 独立模块 · Main Agent 调度 Subagent 并行开发

## 技术栈

**前端**: React 19 + TS + Vite 7 + Storybook 8 + Zustand + CSS Modules + React Router 7
**后端**: FastAPI + SQLite (aiosqlite + SQLAlchemy 2.0 async) + WebSocket + JWT
**端口**: 前端 5173 / 后端 8000 / Storybook 6006

## 数据库

4 张表: `users`, `chats`, `chat_members`, `messages`

```sql
-- users: id, username(UNIQUE), nickname, avatar_url, password_hash, created_at
-- chats: id, type(private/group), name, avatar_url, created_at
-- chat_members: id, chat_id→chats, user_id→users, role(owner/admin/member), joined_at
-- messages: id, chat_id→chats, sender_id→users, content, type(text/image/system), created_at
```

## 目录结构

```
chat-app/
├── PLAN.md                        ← 本文件 (主计划 + TODO)
├── plan/
│   └── references/
│       ├── phase_1.md             # 脚手架 — 详细执行计划
│       ├── phase_2.md             # 用户系统
│       ├── phase_3.md             # 1v1 私聊
│       ├── phase_4.md             # 群聊
│       └── phase_5.md             # 体验优化
├── start.sh
├── frontend/                      # React + Storybook
│   ├── .storybook/
│   └── src/
│       ├── types/                 # 共享类型
│       ├── components/            # UI 组件 (.tsx + .module.css + .stories.tsx)
│       ├── hooks/
│       ├── stores/
│       ├── services/
│       └── utils/
└── backend/                       # FastAPI + SQLite
    ├── server.py
    ├── database.py
    ├── models.py, schemas.py, auth.py
    ├── routes/
    └── websocket/
```

---

## 执行总览

> Main Agent 读取本文件 → 按 Phase 顺序推进 → 每个 Phase 读取对应 `plan/references/phase_N.md` → 派发 Subagent 并行执行 → 验收门禁通过后进入下一 Phase

| Phase | 名称 | Subagents | 详细计划 | 状态 |
|-------|------|-----------|----------|------|
| 1 | 脚手架 | 2 (前端 ‖ 后端) | [phase_1.md](plan/references/phase_1.md) | ✅ |
| 2 | 用户系统 | 2 (Auth API ‖ LoginPanel) + 联调 | [phase_2.md](plan/references/phase_2.md) | ✅ |
| 3 | 1v1 私聊 | 3+2 (两轮并行) + 联调 | [phase_3.md](plan/references/phase_3.md) | ✅ |
| 4 | 群聊 | 2 (后端 ‖ 前端) + 联调 | [phase_4.md](plan/references/phase_4.md) | ✅ |
| 5 | 体验优化 | 4 全并行 | [phase_5.md](plan/references/phase_5.md) | ✅ |

---

## Phase TODO

### Phase 1 — 脚手架
- [x] 前端: Vite + React + TS 初始化，Storybook 配通，`src/types/` 全局类型，微信风格 CSS
- [x] 后端: FastAPI 入口，SQLAlchemy models 4 张表，schemas，requirements.txt
- [x] start.sh 一键启动
- [x] **门禁**: `pnpm dev` ✓ / `pnpm storybook` ✓ / `python server.py` ✓ / 表自动建好

### Phase 2 — 用户系统
- [x] 后端: `/register` + `/login` API, JWT 中间件
- [x] 前端: LoginPanel 组件 + Story, authStore, useAuth hook
- [x] 联调: 前后端对接, 路由守卫
- [x] **门禁**: 注册→登录→拿到 token→受保护路由可访问

### Phase 3 — 1v1 私聊
- [x] 后端: chat/message REST API (CRUD + 分页)
- [x] 前端: UserAvatar / MessageBubble / MessageInput 原子组件 + Stories
- [x] WebSocket: 后端 manager+handler, 前端 useWebSocket hook
- [x] 前端: ChatList+Sidebar (chatStore), ChatWindow (messageStore)
- [x] 联调: 端到端实时收发
- [x] **门禁**: 两用户可互相发消息，刷新后历史消息仍在

### Phase 4 — 群聊
- [x] 后端: 建群/邀请/群消息广播 API + WS 扩展
- [x] 前端: GroupManager 组件 + Story, 群聊 UI 差异
- [x] 联调: 群聊收发
- [x] **门禁**: 3+ 用户群内消息互通，成员增删正常

### Phase 5 — 体验优化
- [x] 未读消息计数 + 红点
- [x] 在线状态指示器
- [x] 输入中提示 + 发送状态
- [x] 时间分组 + 响应式布局
- [x] **门禁**: 各特性独立可演示

---

## 启动

```bash
cd chat-app && ./start.sh
# 或:  frontend/ → pnpm dev | pnpm storybook
#      backend/  → python server.py
```
