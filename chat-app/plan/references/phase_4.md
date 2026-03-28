# Phase 4 — 群聊

## 概览

| 项 | 值 |
|---|---|
| 前置依赖 | Phase 3 ✅ (私聊可用) |
| Subagent 数 | 2 (并行) + Main Agent 联调 |
| 核心思路 | 在私聊基础上扩展, 复用 Chat/Message 模型 (type=group) |

---

## 接口约定

```
POST   /api/chats/group           → ChatOut      # 创建群聊
  Request: { name: string, member_ids: number[] }

POST   /api/chats/:id/members     → void         # 邀请成员
  Request: { user_ids: number[] }

DELETE /api/chats/:id/members/:uid → void         # 移除成员 (仅 owner/admin)

GET    /api/chats/:id/members      → ChatMemberOut[]  # 群成员列表
```

WebSocket 扩展:
```
服务端 → 客户端 (新增类型):
  { "type": "member_joined", "chat_id": 1, "user": UserOut }
  { "type": "member_left", "chat_id": 1, "user_id": 5 }
```

---

## Step 1 — 并行派发

### Subagent A: 后端群聊扩展

**修改文件**:
| 文件 | 工作 |
|---|---|
| `routes/chat_routes.py` | `POST /chats/group` — 创建群, 自动加入 creator 为 owner; `GET /chats/:id/members`; `POST /chats/:id/members`; `DELETE /chats/:id/members/:uid` |
| `websocket/manager.py` | `send_to_chat()` 已支持群发 — 确认群成员查询逻辑正确 |
| `websocket/handler.py` | 群消息: 发送者向 chat 内所有其他在线成员广播; 成员变更时发送 system message + WS 通知 |
| `schemas.py` | `GroupCreate`, `ChatMemberOut`, `AddMembersRequest` |

**注意**: 群消息和私聊消息共用 `messages` 表和 WS 消息格式, 仅 broadcast 对象不同

---

### Subagent B: 前端 GroupManager + 群聊 UI

**产物清单**:
| 文件 | 工作 |
|---|---|
| `components/GroupManager/GroupManager.tsx` | 创建群: 群名输入 + 多选联系人; 群设置: 成员列表 + 邀请/移除 |
| `components/GroupManager/GroupManager.module.css` | 弹窗/抽屉样式 |
| `components/GroupManager/GroupManager.stories.tsx` | 创建态 / 管理态 / 空成员 |
| `services/chatService.ts` | 补充 `createGroup()`, `getMembers()`, `addMembers()`, `removeMember()` |
| `stores/chatStore.ts` | 补充群相关 action |
| `components/ChatWindow/ChatWindow.tsx` | 群聊时: 顶栏显示群名+人数, 消息气泡显示发送者昵称 |
| `components/ChatList/ChatList.tsx` | 群聊头像区分 (多头像拼接或群图标) |
| `components/Sidebar/Sidebar.tsx` | 添加 "创建群聊" 按钮 |

---

## Step 2 — Main Agent 联调

### 门禁检查

```
1. 用户 A 创建群聊 "测试群", 邀请 B 和 C
2. A 发送消息 → B 和 C 均实时收到, 气泡上显示 A 的昵称
3. B 回复 → A 和 C 均收到
4. A 邀请 D 加入 → 群内显示 "D 加入了群聊" 系统消息
5. A 移除 D → D 不再收到群消息
6. 群聊和私聊在 ChatList 中共存, 切换正常
7. Storybook: GroupManager 各状态正常渲染
```

**全部通过 → Phase 4 ✅ → 进入 Phase 5**
