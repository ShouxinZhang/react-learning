# React + Python 学习项目

## 目录结构
```
├── frontend/              # React 前端
├── services/
│   └── api-python/        # Python 后端
└── restart_web.sh         # 一键启动
```

## 启动
```bash
./restart_web.sh
```

- 前端: http://localhost:3201
- 后端: http://localhost:5000

## 配置
- 环境变量:
  - `FRONTEND_PORT`: 前端端口 (默认 3201)
  - `BACKEND_PORT`: 后端端口 (默认 5000)
  - `VITE_API_BASE_URL`: 前端请求地址 (默认 `http://localhost:${BACKEND_PORT}`)
- 前端示例配置: `frontend/.env.example`
