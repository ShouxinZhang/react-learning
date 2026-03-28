# Phase 5 — 体验优化

## 概览

| 项 | 值 |
|---|---|
| 前置依赖 | Phase 4 ✅ (私聊+群聊可用) |
| Subagent 数 | 4 (全并行, 互不依赖) |
| 特点 | 各特性独立, 无相互依赖, 最大并行度 |

---

## Step 1 — 全并行派发

### Subagent A: 未读消息计数 + 红点

**前端**:
- `chatStore` 增加 `unreadCount` 按 chat_id 记录
- 收到 WS 消息时: 非当前会话 → unreadCount++
- 切换到会话时: unreadCount 归零
- `ChatList` 列表项右侧显示红点数字 (>99 显示 99+)

**后端**:
- 可选: `GET /chats` 返回每个 chat 的 `unread_count` (基于 last_read_message_id)
- `chat_members` 表可加 `last_read_at` 字段

**门禁**: 收到未读消息 → 列表显示红点 → 进入会话 → 红点消失

---

### Subagent B: 在线状态指示器

**后端**:
- `ConnectionManager` 维护在线用户集合
- WS 连接/断开时向好友广播: `{ "type": "presence", "user_id": 1, "online": true/false }`

**前端**:
- `UserAvatar` 组件: online 时右下角绿点
- Zustand 或 context 维护 `onlineUsers: Set<number>`
- 收到 presence 消息更新集合

**门禁**: B 登录 → A 侧 B 头像出现绿点 → B 关闭页面 → 绿点消失

---

### Subagent C: 输入中提示 + 发送状态

**WebSocket 扩展**:
```
客户端 → 服务端: { "type": "typing", "chat_id": 1 }
服务端 → 对方:   { "type": "typing", "chat_id": 1, "user_id": 2 }
```

**前端**:
- `MessageInput` 输入时节流发送 typing 事件 (3s 间隔)
- `ChatWindow` 底部显示 "对方正在输入..." (3s 无新 typing → 隐藏)
- 消息发送状态: sending → sent (收到服务端 ack); 用 `MessageBubble` 右下角小图标

**门禁**: A 输入时 → B 看到 "正在输入..." → A 停止 3s 后消失

---

### Subagent D: 时间分组 + 响应式布局

**时间分组**:
- `utils/formatTime.ts` 完善: 今天 HH:mm / 昨天 / 本周几 / MM-DD / YYYY-MM-DD
- `ChatWindow` 消息列表中: 间隔 >5 分钟的消息之间插入时间分隔线

**响应式布局**:
- 移动端 (<768px): Sidebar 全屏, 点击会话 → ChatWindow 全屏, 返回按钮
- 桌面端: 左右分栏 (300px + auto)
- CSS media query, 无额外库

**门禁**: 缩小窗口至移动端宽度 → Sidebar/ChatWindow 单屏切换正常; 消息时间显示符合预期

---

## Step 2 — Main Agent 验收

### 综合门禁

```
1. 完整流程: 注册 → 登录 → 搜索用户 → 发起私聊 → 实时收发
2. 群聊: 建群 → 群消息 → 成员管理
3. 未读: 切换会话 → 红点消失
4. 在线: 登录/登出 → 绿点变化
5. 输入: typing 提示出现/消失
6. 时间: 消息间插入时间分隔
7. 响应式: 移动端布局切换流畅
8. Storybook: 所有组件 Story 正常渲染
```

**全部通过 → Phase 5 ✅ → 项目完成 🎉**
