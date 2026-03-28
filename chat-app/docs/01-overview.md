# Chat App — 项目概览

一个全栈实时聊天应用，用于学习 React + FastAPI + WebSocket。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite 6 + Zustand 5 |
| 后端 | FastAPI + SQLAlchemy 2 (async) + aiosqlite |
| 通信 | REST API + WebSocket |
| 数据库 | SQLite (WAL 模式) |
| 认证 | JWT (HS256) + bcrypt |
| 样式 | CSS Modules |
| 测试 | pytest + vitest + E2E 脚本 |

## 功能

- 用户注册 / 登录（JWT 认证）
- 私聊（1 对 1）
- 群聊（创建、加人、踢人）
- 实时消息收发（WebSocket）
- 在线状态 / 正在输入指示
- 消息历史分页加载
- 未读计数

## 项目结构

```
chat-app/
├── start.sh                ← 一键启动
├── test.sh                 ← 一键测试
├── test_e2e.py             ← E2E 集成测试
├── docs/                   ← 文档
│
├── backend/
│   ├── server.py           ← FastAPI 入口 + CORS + 路由注册
│   ├── database.py         ← 异步数据库引擎 (SQLite + WAL)
│   ├── models.py           ← 4 张表: User, Chat, ChatMember, Message
│   ├── auth.py             ← JWT + bcrypt 认证
│   ├── schemas.py          ← Pydantic 请求/响应模型
│   ├── routes/
│   │   ├── auth_routes.py  ← 注册 / 登录
│   │   ├── user_routes.py  ← 当前用户 / 搜索用户
│   │   ├── chat_routes.py  ← 聊天 CRUD / 群组管理
│   │   ├── message_routes.py ← 消息历史
│   │   └── admin_routes.py ← 超级管理 (仅开发)
│   ├── websocket/
│   │   ├── manager.py      ← 连接管理器
│   │   └── handler.py      ← WS 消息路由
│   └── tests/              ← 后端单元测试
│
└── frontend/
    └── src/
        ├── App.tsx          ← 路由入口
        ├── types/           ← TypeScript 类型
        ├── services/        ← API 调用层
        ├── stores/          ← Zustand 状态管理
        ├── hooks/           ← 自定义 Hooks
        └── components/      ← UI 组件
```

## 快速开始

```bash
cd chat-app
bash start.sh
```

- 前端: http://localhost:5173
- 后端: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 运行测试

```bash
bash test.sh
```
