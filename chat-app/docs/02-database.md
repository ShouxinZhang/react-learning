# 数据库设计

数据库: SQLite（文件 `backend/chat.db`），通过 SQLAlchemy 2 异步 ORM 操作。  
开启了 WAL 模式以支持并发读取。

## ER 关系

```
User 1──N ChatMember N──1 Chat
User 1──N Message    N──1 Chat
```

## 表结构

### users

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INTEGER | PK, 自增 | |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 登录名 (3-20 字符, 字母/数字/下划线) |
| nickname | VARCHAR(50) | NOT NULL | 显示名 |
| avatar_url | VARCHAR(255) | 可为空 | 头像 URL |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 哈希 |
| password_plain | VARCHAR(255) | 可为空 | 明文密码 (仅开发环境) |
| created_at | DATETIME | server_default=now() | 注册时间 |

### chats

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INTEGER | PK, 自增 | |
| type | VARCHAR(10) | NOT NULL | `"private"` 或 `"group"` |
| name | VARCHAR(100) | 可为空 | 群聊名称 (私聊为空) |
| avatar_url | VARCHAR(255) | 可为空 | 群头像 |
| created_at | DATETIME | server_default=now() | |

### chat_members

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INTEGER | PK, 自增 | |
| chat_id | INTEGER | FK → chats.id | |
| user_id | INTEGER | FK → users.id | |
| role | VARCHAR(10) | 默认 `"member"` | `"owner"` / `"admin"` / `"member"` |
| joined_at | DATETIME | server_default=now() | |

### messages

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INTEGER | PK, 自增 | |
| chat_id | INTEGER | FK → chats.id | |
| sender_id | INTEGER | FK → users.id | |
| content | TEXT | NOT NULL | 消息内容 |
| type | VARCHAR(10) | 默认 `"text"` | `"text"` / `"image"` / `"system"` |
| created_at | DATETIME | server_default=now() | |

## 查看数据库

```bash
# 命令行查看
sqlite3 backend/chat.db ".tables"
sqlite3 backend/chat.db "SELECT id, username, nickname FROM users;"

# 通过 admin API 查看用户（含密码）
curl http://localhost:8000/api/admin/users
```
