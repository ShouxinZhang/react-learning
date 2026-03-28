# API 参考

Base URL: `http://localhost:8000/api`

认证方式：请求头 `Authorization: Bearer <JWT token>`

---

## 认证

### POST /register — 注册

```json
// 请求
{ "username": "alice", "password": "123456", "nickname": "Alice" }

// 响应 200
{
  "user": { "id": 1, "username": "alice", "nickname": "Alice", "avatar_url": null, "created_at": "..." },
  "token": "eyJ..."
}
```

校验规则:
- `username`: 3-20 字符，仅 `[a-zA-Z0-9_]`
- `password`: ≥ 6 字符
- 用户名不可重复 (409)

### POST /login — 登录

```json
// 请求
{ "username": "alice", "password": "123456" }

// 响应 200 — 同 register
// 错误 401 — "Invalid username or password"
```

---

## 用户 🔒

### GET /me — 当前用户信息

```json
// 响应 200
{ "id": 1, "username": "alice", "nickname": "Alice", "avatar_url": null, "created_at": "..." }
```

### GET /users/search?q=bob — 搜索用户

返回最多 20 个匹配用户（排除自己），按用户名/昵称模糊搜索。

---

## 聊天 🔒

### GET /chats — 获取聊天列表

按最新消息时间排序，私聊自动显示对方昵称。

```json
// 响应 200
[
  {
    "id": 1, "type": "private", "name": "Bob",
    "last_message": { "id": 5, "content": "你好", "sender_id": 2, ... },
    "members": [{ "id": 1, ... }, { "id": 2, ... }]
  }
]
```

### POST /chats — 创建私聊

幂等：如果和对方已有私聊，直接返回已有的。

```json
// 请求
{ "user_id": 2 }
```

### POST /chats/group — 创建群聊

```json
// 请求
{ "name": "项目组", "member_ids": [2, 3] }
```

### GET /chats/{chat_id}/members — 获取群成员

### POST /chats/{chat_id}/members — 添加群成员

```json
{ "user_ids": [4, 5] }
```

### DELETE /chats/{chat_id}/members/{user_id} — 移除群成员

---

## 消息 🔒

### GET /chats/{chat_id}/messages — 消息历史

分页加载，按时间倒序返回。

| 参数 | 默认 | 说明 |
|---|---|---|
| `limit` | 20 | 每页条数 (1-50) |
| `before` | - | 消息 ID，获取此 ID 之前的消息 |

```json
// 响应 200
[
  {
    "id": 1, "chat_id": 1, "sender_id": 1,
    "content": "你好", "type": "text",
    "created_at": "...", "sender_nickname": "Alice"
  }
]
```

---

## 管理 (仅开发环境)

### GET /admin/users — 查看所有用户（含明文密码）

### POST /admin/reset-password?username=alice&new_password=xxx — 重置密码

---

## 自动生成文档

FastAPI 自带交互式 API 文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
