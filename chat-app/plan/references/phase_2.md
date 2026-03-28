# Phase 2 — 用户系统

## 概览

| 项 | 值 |
|---|---|
| 前置依赖 | Phase 1 ✅ |
| Subagent 数 | 2 (并行) + Main Agent 联调 |
| 接口约定 | 见下方 (Subagent 共享) |

---

## 接口约定 (前后端共享)

```
POST /api/register
  Request:  { username: string, password: string, nickname: string }
  Response: { user: UserOut, token: string }

POST /api/login
  Request:  { username: string, password: string }
  Response: { user: UserOut, token: string }

GET /api/me
  Header:   Authorization: Bearer <token>
  Response: UserOut
```

`UserOut`: `{ id, username, nickname, avatar_url, created_at }`

---

## Step 1 — 并行派发

### Subagent A: 后端 Auth API

**职责**: 实现用户注册/登录/鉴权

**修改文件**:
| 文件 | 工作 |
|---|---|
| `auth.py` | 实现 `hash_password`, `verify_password` (passlib bcrypt), `create_token` / `decode_token` (python-jose), `get_current_user` 依赖注入 |
| `routes/auth_routes.py` | `POST /register` — 查重 → 建用户 → 返回 token; `POST /login` — 校验密码 → 返回 token |
| `routes/user_routes.py` | `GET /me` — 需鉴权, 返回当前用户信息 |
| `server.py` | 挂载 auth_router, user_router 到 `/api` prefix |
| `schemas.py` | 补充 `UserCreate`, `LoginRequest`, `AuthResponse` |

**安全要点**:
- 密码 bcrypt hash, 原文不存储不日志
- JWT expiry 24h, secret 从环境变量读取或默认 dev key
- username 输入校验: 长度 3-20, 仅字母数字下划线

---

### Subagent B: 前端 LoginPanel

**职责**: 登录/注册 UI + 状态管理

**产物清单**:
| 文件 | 工作 |
|---|---|
| `components/LoginPanel/LoginPanel.tsx` | 登录/注册表单切换, 输入验证, 提交 |
| `components/LoginPanel/LoginPanel.module.css` | 微信风格: 绿色主按钮, 居中卡片 |
| `components/LoginPanel/LoginPanel.stories.tsx` | Stories: 登录态 / 注册态 / 加载中 / 错误提示 |
| `stores/authStore.ts` | Zustand: `{ user, token, login(), register(), logout(), isAuthenticated }` |
| `hooks/useAuth.ts` | 封装 authStore, 提供 `useAuth()` |
| `services/api.ts` | fetch 封装: baseURL, auth header 注入, 错误处理 |
| `services/authService.ts` | `register()`, `login()`, `getMe()` |
| `src/App.tsx` | 路由: `/login` → LoginPanel, `/` → 主页占位, 路由守卫 (未登录重定向) |

---

## Step 2 — Main Agent 联调

**工作**:
1. 前端 `services/api.ts` 中 baseURL 指向 `http://localhost:8000/api`
2. 端到端测试: 打开浏览器 → 注册 → 登录 → 跳转主页 → 刷新 token 仍有效

### 门禁检查

```bash
# 后端 API 测试
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456","nickname":"Test"}'
# → 200 + { user, token }

curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
# → 200 + { user, token }

# 前端 Storybook
# LoginPanel story 中 登录/注册/加载/错误 四个状态可正常渲染

# 端到端
# 浏览器 :5173 → 自动跳转 /login → 注册 → 登录 → 进入主页
```

**全部通过 → Phase 2 ✅ → 进入 Phase 3**
