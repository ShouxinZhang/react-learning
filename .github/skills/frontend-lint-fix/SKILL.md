---
name: frontend-lint-fix
description: "前端代码门禁：一键修复 TypeScript 编译错误。Use when: 前端报错、tsc 编译失败、TypeScript errors、lint fix、compile errors、修复报错、代码门禁、type check。"
argument-hint: "可选：指定要检查的目录，默认 chat-app/frontend/src"
---

# 前端代码门禁 — 一键修复

自动检测并修复前端 TypeScript 编译错误，确保代码能通过 `tsc --noEmit`。

## 适用场景

- 批量修复 TypeScript 编译报错
- 新增代码后的门禁检查
- CI 前的本地预检

## 执行流程

### 1. 收集错误

使用 `get_errors` 工具获取 `chat-app/frontend/src` 下所有编译错误。若用户指定了其他目录则检查该目录。

同时在终端运行确认：
```bash
cd chat-app/frontend && npx tsc --noEmit 2>&1
```

### 2. 分类错误

按以下常见类别归类，优先修复根因（靠前的类别会引发级联错误）：

| 优先级 | 错误类型 | 典型信息 | 修复方式 |
|--------|---------|---------|---------|
| P0 | 缺少依赖包 | `Cannot find module '@xxx'` (node_modules) | `pnpm add [-D] <pkg>` |
| P1 | useRef 初始值缺失 | `Expected 1 arguments, but got 0` on `useRef` | 添加 `undefined` 作为初始参数：`useRef<T>(undefined)` |
| P2 | 缺少 import | `Cannot find name 'xxx'` | 在文件顶部添加正确的 import 语句 |
| P3 | 模块找不到（本地文件） | `Cannot find module './xxx'` (文件确实存在) | 重启 TS Server（`typescript.restartTsServer`），或检查路径拼写 |
| P4 | 隐式 any 类型 | `Parameter 'x' implicitly has an 'any' type` | 通常是级联错误，修复根因后自动消失；若非级联则显式标注类型 |
| P5 | 未使用变量/导入 | `is declared but its value is never read` | 删除未使用的声明，或在确需保留时加 `_` 前缀 |
| P6 | 类型不兼容 | `Type 'X' is not assignable to type 'Y'` | 修正类型定义或使用类型断言 |

### 3. 逐一修复

按优先级从 P0 到 P6 依次修复：

- **P0 缺少依赖包**：检查 `package.json`，运行 `pnpm add [-D] <pkg>` 安装缺失的包
- **P1 useRef 初始值**：React 19 要求 `useRef()` 必须传初始值，改为 `useRef<T>(undefined)` 或 `useRef<T>(null)`
- **P2 缺少 import**：从项目内的 hooks/stores/utils 或 react 等包补充 import
- **P3 模块找不到（本地文件存在）**：先执行 `typescript.restartTsServer`，若依然报错再检查路径
- **P4-P6**：按常规 TypeScript 修复方法处理

### 4. 验证

修复后执行两步验证：

1. `get_errors` 确认 VS Code 无报错
2. 终端运行 `npx tsc --noEmit` 确认编译通过

若 `get_errors` 仍有残留但 `tsc --noEmit` 通过，执行 `typescript.restartTsServer` 刷新 TS Server 缓存。

### 5. 汇报

输出修复摘要：
```
✅ 前端门禁通过 — tsc --noEmit 零错误
修复内容：
- [file.tsx] 补充 useCallback, useTypingIndicator import
- [useWebSocket.ts] useRef 添加 undefined 初始值
- 安装缺失依赖 @storybook/test
```

## React 19 常见陷阱

- `useRef<T>()` → 必须传初始值：`useRef<T>(undefined)` 或 `useRef<T>(null)`
- `@types/react` v19 变更了多个泛型签名，注意查看升级指南
- `forwardRef` 在 React 19 中已弃用，改用 `ref` prop

## 项目约定

- 包管理器：`pnpm`
- 配置文件：`tsconfig.app.json`（strict 模式）
- 框架：React 19 + Vite + Zustand 5 + React Router 7
