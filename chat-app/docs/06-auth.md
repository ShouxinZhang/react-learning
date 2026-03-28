# 认证机制

## 流程

```
注册/登录
    │
    ▼
后端验证 → 生成 JWT → 返回 {user, token}
    │
    ▼
前端存 token 到 localStorage
    │
    ├── HTTP 请求: Authorization: Bearer <token>
    └── WebSocket: ws://…/ws?token=<token>
```

## JWT 配置

| 项 | 值 |
|---|---|
| 算法 | HS256 |
| 密钥 | 环境变量 `JWT_SECRET` (开发默认: `"dev-secret-change-in-prod"`) |
| 过期时间 | 24 小时 |
| Payload | `{"sub": "<user_id>", "exp": <timestamp>}` |

## 密码存储

| 方式 | 字段 | 说明 |
|---|---|---|
| bcrypt 哈希 | `password_hash` | 生产级安全，不可逆 |
| 明文备份 | `password_plain` | 仅开发环境，方便查看 |

## 后端认证依赖

```python
# 任何需要认证的路由，加上这个依赖参数即可
async def some_route(user: User = Depends(get_current_user)):
    ...
```

`get_current_user` 从 `Authorization: Bearer <token>` 头提取 JWT，解码得到 user_id，查数据库返回 User 对象。失败返回 401。

## WebSocket 认证

WebSocket 无法设自定义 Header，所以 token 通过 URL query param 传递:

```
ws://localhost:8000/ws?token=eyJ...
```

服务端在 `onconnect` 时验证 token，失败则以 code 4001 关闭连接。

## 开发环境快速查看

```bash
# 查看所有用户和密码
curl http://localhost:8000/api/admin/users

# 重置密码
curl -X POST "http://localhost:8000/api/admin/reset-password?username=alice&new_password=newpass"
```
