# 前端架构

## 状态管理 (Zustand)

应用使用 3 个独立的 Zustand store：

```
┌─────────────┐  ┌─────────────┐  ┌──────────────┐
│  authStore   │  │  chatStore   │  │ messageStore │
│             │  │             │  │              │
│ user        │  │ chats[]     │  │ messagesByChat│
│ token       │  │ currentChat │  │ hasMore      │
│ isAuth      │  │ unreadCounts│  │ loading      │
└─────────────┘  └─────────────┘  └──────────────┘
       ▲                ▲                 ▲
       │                │                 │
       └────── useChat hook (WebSocket) ──┘

┌──────────────┐
│presenceStore │  ← 在线状态 (Set<userId>)
└──────────────┘
```

### authStore
- `user` / `token` / `isAuthenticated` — 登录状态
- `login()` / `register()` / `logout()` / `checkAuth()` — 认证操作
- token 持久化到 localStorage

### chatStore
- `chats[]` — 聊天列表 (含最后一条消息)
- `currentChatId` — 当前打开的聊天
- `unreadCounts` — 未读计数 `{chatId: count}`
- 按最新消息时间排序

### messageStore
- `messagesByChat` — `{chatId: Message[]}` 按时间正序
- `hasMore` — `{chatId: boolean}` 是否还有更多历史
- `fetchHistory()` — 首次加载
- `loadMore()` — 分页加载更早的消息

### presenceStore
- `onlineUsers` — `Set<number>` 在线用户 ID 集合
- 由 WebSocket 的 `presence` / `online_users` 消息驱动

---

## 组件树

```
App
├── LoginPanel          ← /login 路由
│   └── (登录/注册表单)
│
└── Home                ← / 路由 (需认证)
    ├── Sidebar
    │   ├── Tab: 聊天 → ChatList
    │   │   └── ChatItem × N
    │   │       └── UserAvatar
    │   ├── Tab: 联系人 → ContactList
    │   │   └── (搜索框 + 用户列表)
    │   ├── Button: +群 → GroupManager (modal)
    │   └── 用户信息 + 退出按钮
    │
    └── ChatWindow
        ├── Header (聊天名称, 返回按钮)
        ├── MessageList
        │   ├── 加载更多 button
        │   ├── 时间分隔符
        │   └── MessageBubble × N
        ├── TypingIndicator
        └── MessageInput (textarea + 发送按钮)
```

---

## Hooks

| Hook | 用途 |
|---|---|
| `useAuth` | authStore 的便捷封装 |
| `useWebSocket` | 全局单例 WS 连接，自动重连 |
| `useChat` | WS 消息分发：新消息/输入中/在线状态 |
| `useTypingIndicator` | 3s 超时的输入中状态 |

### WebSocket 架构

WebSocket 采用全局单例设计，避免组件多实例导致多连接：

```
globalConnect() ──▶ 单一 WebSocket 连接
     │
     ▼
globalHandlers (Set) ──▶ 各组件通过 useWebSocket() 注册回调
     │
     ▼
globalSend() ──▶ 任何地方都可以调用发消息
```

---

## Services 层

所有 HTTP 请求通过 `services/api.ts` 的封装客户端发出，自动注入 Bearer token。

| Service | 方法 |
|---|---|
| `authService` | `login()`, `register()`, `getMe()` |
| `chatService` | `getChats()`, `createPrivateChat()`, `searchUsers()`, `createGroup()`, `getMembers()`, `addMembers()`, `removeMember()` |
| `messageService` | `getMessages(chatId, before?, limit?)` |

---

## 样式方案

- **CSS Modules** — 每个组件 `ComponentName.module.css`
- 组件通过 `import styles from './X.module.css'` 引入
- 类名：`styles.container`, `styles.header` 等
- 全局样式：`App.css`, `index.css`
