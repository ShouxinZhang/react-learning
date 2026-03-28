# Phase 3 — 1v1 私聊

## 概览

| 项 | 值 |
|---|---|
| 前置依赖 | Phase 2 ✅ (用户系统可用) |
| Subagent 数 | 第一轮 3 并行 + 第二轮 2 并行 + Main Agent 联调 |
| 复杂度 | 最高 — 本 Phase 是核心 |

---

## 接口约定 (前后端共享)

### REST API

```
GET    /api/users/search?q=xxx     → UserOut[]          # 搜索用户
GET    /api/chats                  → ChatOut[]           # 当前用户的会话列表
POST   /api/chats                  → ChatOut             # 创建私聊 { user_id: number }
GET    /api/chats/:id/messages?before=&limit=20 → MessageOut[]  # 历史消息 (向上翻页)
```

### WebSocket

```
连接: ws://localhost:8000/ws?token=<jwt>

客户端 → 服务端:
  { "type": "message", "chat_id": 1, "content": "hello" }

服务端 → 客户端:
  { "type": "new_message", "message": MessageOut }
  { "type": "error", "detail": "..." }
```

---

## Step 1 — 第一轮并行 (3 Subagent)

### Subagent A: 后端 Chat/Message REST API

**修改文件**:
| 文件 | 工作 |
|---|---|
| `routes/user_routes.py` | `GET /users/search` — 按 username/nickname 模糊查询 |
| `routes/chat_routes.py` | `GET /chats` — 当前用户的所有会话 (含最后一条消息预览); `POST /chats` — 创建私聊 (幂等: 已存在则返回) |
| `routes/message_routes.py` | `GET /chats/:id/messages` — 分页 (cursor-based, before + limit) |
| `schemas.py` | 补充 `ChatOut` (含 last_message, members), `MessageOut`, `ChatCreate` |

---

### Subagent B: 前端原子 UI 组件

**产物清单** (每个含 .tsx + .module.css + .stories.tsx):

| 组件 | 要点 |
|---|---|
| `UserAvatar` | props: `src`, `name`, `size`, `online?`; 无图时显示首字母; 圆形 |
| `MessageBubble` | props: `message`, `isMine`; 左灰右绿气泡; 时间戳; 长文本换行 |
| `MessageInput` | textarea + 发送按钮; Enter 发送 / Shift+Enter 换行; 空内容禁用发送 |

**Stories 要求**:
- UserAvatar: 有/无头像, 各尺寸, 在线/离线
- MessageBubble: 自己/他人, 短文本/长文本/单行
- MessageInput: 空/有内容, 聚焦态

---

### Subagent C: WebSocket 层 (前后端)

**修改文件**:
| 文件 | 工作 |
|---|---|
| `websocket/manager.py` | `ConnectionManager`: `connect(ws, user_id)`, `disconnect(user_id)`, `send_to_user(user_id, data)`, `send_to_chat(chat_id, data)` — 维护 user_id→WebSocket 映射 |
| `websocket/handler.py` | WS endpoint `/ws`: token 鉴权 → 注册连接 → 消息循环: 收到 `type:message` → 存入 DB → 推送给 chat 内其他在线成员 |
| `server.py` | 挂载 WS endpoint |
| `hooks/useWebSocket.ts` (前端) | `useWebSocket()`: 连接管理, 自动重连 (指数退避), token 鉴权, 收到消息写入 messageStore |

---

## Step 2 — 第二轮并行 (2 Subagent)

> 等待 Step 1 全部完成后执行

### Subagent D: 左侧面板 (ChatList + Sidebar + ContactList)

**产物清单**:
| 文件 | 工作 |
|---|---|
| `stores/chatStore.ts` | `{ chats, currentChatId, fetchChats(), setCurrentChat(), addChat() }` |
| `services/chatService.ts` | `getChats()`, `createPrivateChat(userId)` |
| `components/ChatList/ChatList.tsx` | 会话列表: 头像 + 名字 + 最后消息预览 + 时间; 点击切换当前会话 |
| `components/ChatList/ChatList.module.css` | 微信风格列表 |
| `components/ChatList/ChatList.stories.tsx` | 空列表 / 多会话 / 当前选中高亮 |
| `components/ContactList/ContactList.tsx` | 搜索框 + 用户列表; 点击发起私聊 |
| `components/ContactList/ContactList.module.css` | |
| `components/ContactList/ContactList.stories.tsx` | |
| `components/Sidebar/Sidebar.tsx` | Tab 切换: 聊天 / 联系人; 容器组件 |
| `components/Sidebar/Sidebar.module.css` | 左侧固定宽 300px |
| `components/Sidebar/Sidebar.stories.tsx` | |

---

### Subagent E: 右侧面板 (ChatWindow)

**产物清单**:
| 文件 | 工作 |
|---|---|
| `stores/messageStore.ts` | `{ messages(by chatId), fetchHistory(), addMessage(), prependMessages() }` |
| `services/messageService.ts` | `getMessages(chatId, before?)` |
| `hooks/useChat.ts` | 组合 chatStore + messageStore + useWebSocket: `sendMessage()`, `loadMore()` |
| `components/ChatWindow/ChatWindow.tsx` | 顶栏(对方名字) + 消息列表(滚动到底, 上拉加载) + MessageInput |
| `components/ChatWindow/ChatWindow.module.css` | flex column 布局 |
| `components/ChatWindow/ChatWindow.stories.tsx` | 空聊天 / 多消息 / 加载中 |
| `src/App.tsx` | 更新路由: 左 Sidebar + 右 ChatWindow 布局 |

---

## Step 3 — Main Agent 联调

**工作**:
1. 确保 WS 连接建立后消息实时到达双方
2. 刷新页面后历史消息正确加载
3. 新建私聊 → 发消息 → 对方收到 → 完整流程

### 门禁检查

```
1. 打开两个浏览器标签, 分别登录用户 A 和用户 B
2. A 搜索 B → 发起私聊 → 发送 "hello"
3. B 侧实时收到消息, 气泡显示在左侧(灰色)
4. B 回复 "hi" → A 实时收到
5. A 刷新页面 → 历史消息仍在, 顺序正确
6. Storybook 中所有新组件 Story 正常渲染
```

**全部通过 → Phase 3 ✅ → 进入 Phase 4**
