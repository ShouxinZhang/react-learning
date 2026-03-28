# WebSocket 协议

连接地址: `ws://localhost:8000/ws?token=<JWT>`

认证通过 URL query param 传递 JWT token。连接成功后服务端自动推送在线用户列表。

---

## 连接生命周期

```
客户端                              服务端
  │                                   │
  │─── ws://…/ws?token=xxx ──────────▶│  验证 JWT
  │                                   │
  │◀── { type: "online_users" } ──────│  推送在线列表
  │                                   │
  │    { type: "presence",            │
  │◀──   user_id, online: true } ─────│  广播上线通知
  │                                   │
  │    … 收发消息 …                    │
  │                                   │
  │─── 断开连接 ──────────────────────▶│
  │                                   │
  │    { type: "presence",            │
  │◀──   user_id, online: false } ────│  广播下线通知
```

---

## 消息格式 (JSON)

### 客户端 → 服务端

#### 发送消息

```json
{
  "type": "message",
  "chat_id": 1,
  "content": "你好！"
}
```

#### 发送正在输入

```json
{
  "type": "typing",
  "chat_id": 1
}
```

### 服务端 → 客户端

#### 新消息广播

```json
{
  "type": "new_message",
  "message": {
    "id": 42,
    "chat_id": 1,
    "sender_id": 2,
    "content": "你好！",
    "type": "text",
    "created_at": "2026-03-28T06:16:00",
    "sender_nickname": "Bob"
  }
}
```

#### 正在输入通知

```json
{
  "type": "typing",
  "chat_id": 1,
  "user_id": 2
}
```

#### 在线用户列表 (连接时推送)

```json
{
  "type": "online_users",
  "user_ids": [1, 3, 5]
}
```

#### 上线/下线通知

```json
{
  "type": "presence",
  "user_id": 2,
  "online": true
}
```

---

## 错误处理

| 关闭码 | 含义 |
|---|---|
| 4001 | JWT 无效或过期（不会自动重连） |
| 1006 | 异常断开（客户端自动重连，指数退避最大 30s） |
| 1005 | 正常关闭 |

## 前端重连策略

```
延迟 = min(1000 × 2^attempt, 30000) ms
```

第 1 次重连等 1s，第 2 次 2s，第 3 次 4s … 最长 30s。  
收到 close code 4001 时不重连（需要用户重新登录）。
