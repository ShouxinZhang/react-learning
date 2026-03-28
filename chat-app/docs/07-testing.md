# 测试

## 测试结构

```
chat-app/
├── test.sh                          ← 一键跑全套
├── test_e2e.py                      ← E2E 集成测试
├── backend/
│   ├── conftest.py                  ← pytest 共享 fixtures
│   └── tests/
│       ├── test_auth.py             ← 注册/登录
│       ├── test_users.py            ← 用户查询
│       ├── test_chats.py            ← 聊天 CRUD
│       ├── test_messages.py         ← 消息历史
│       └── test_websocket.py        ← WebSocket
└── frontend/src/components/__tests__/
    ├── MessageBubble.test.tsx       ← 消息气泡
    ├── MessageInput.test.tsx        ← 输入框
    └── UserAvatar.test.tsx          ← 头像
```

## 运行测试

### 全部测试

```bash
cd chat-app && bash test.sh
```

### 仅后端

```bash
cd chat-app/backend
pytest tests/ -v
```

### 仅前端

```bash
cd chat-app/frontend
pnpm test           # watch 模式
pnpm vitest run     # 单次运行
```

### E2E 测试

需要后端先启动:

```bash
# 终端 1: 启动后端
cd backend && uvicorn server:app --port 8000

# 终端 2: 跑 E2E
cd chat-app && python test_e2e.py
```

## 后端测试要点

- 使用 `pytest-asyncio` 进行异步测试
- `conftest.py` 提供共享 fixtures: 测试用 `AsyncSession`、`AsyncClient`、预创建用户
- 每个测试文件独立，不依赖外部服务运行
- 使用 `httpx.AsyncClient` 测试 HTTP 路由

## 前端测试要点

- 使用 `vitest` + `@testing-library/react`
- `jsdom` 环境模拟浏览器 DOM
- `vite.config.ts` 中配置 test 选项
- 组件测试关注渲染结果和交互行为，不测样式

## E2E 测试覆盖

`test_e2e.py` 用纯 HTTP 请求模拟完整用户流程：

1. 健康检查
2. 注册用户 (成功 + 校验失败)
3. 登录 (成功 + 密码错误)
4. 获取当前用户
5. 搜索用户
6. 创建私聊 (幂等性 + 错误处理)
7. 创建群聊
8. 获取聊天列表
9. 获取消息历史
10. 获取群成员
