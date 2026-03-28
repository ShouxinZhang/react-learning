---
name: chrome-devtools-cli
description: "通过 CLI 操控 Chrome 浏览器：导航、截图、执行 JS、性能分析、网络调试。Use when: 浏览器自动化、截图、screenshot、navigate、performance trace、lighthouse、网络请求、console log、页面调试、browser automation、web testing、Chrome DevTools。"
argument-hint: "描述你想对浏览器做什么，例如：打开 https://example.com 并截图"
---

# Chrome DevTools CLI — 浏览器自动化 Skill

通过 `cdt` 命令行工具（封装 `chrome-devtools` CLI）在终端中操控 Chrome 浏览器。  
底层使用 Puppeteer + Chrome DevTools Protocol，所有操作无需 GUI 窗口（headless 模式）。

## 前置条件

- Node.js >= 20.19
- Chrome 已安装
- `chrome-devtools-mcp` 已全局安装（`npm i -g chrome-devtools-mcp@latest`）
- CLI 包装脚本：`.github/scripts/cdt.sh`（已 symlink 到 `~/.local/bin/cdt`）

## 快速参考

### 守护进程管理

```bash
cdt start                  # 启动 (headless + isolated，自动跳过遥测)
cdt start --headless=false # 启动有界面模式（调试用）
cdt stop                   # 停止守护进程
cdt status                 # 查看状态
```

> 如果直接运行其他命令，守护进程会自动启动，无需手动 `cdt start`。

### 导航

```bash
cdt goto https://example.com    # 打开 URL
cdt back                        # 后退
cdt forward                     # 前进
cdt reload                      # 刷新
```

### 页面管理

```bash
cdt pages                   # 列出所有标签页
cdt newtab https://xxx.com  # 新建标签页
cdt select 1                # 切换到标签页 #1
cdt close 2                 # 关闭标签页 #2
```

### 截图 & 快照

```bash
cdt screenshot /tmp/ss.png  # 可视区截图
cdt fullshot /tmp/full.png  # 全页截图
cdt snapshot                # 打印页面 a11y tree（含 uid）
cdt snapshot /tmp/snap.txt  # 保存 a11y tree 到文件
```

### 页面内容获取

```bash
cdt title                   # 获取页面标题
cdt url                     # 获取当前 URL
cdt eval "() => document.querySelectorAll('a').length"  # 执行 JS
cdt console                 # 列出 console 消息
```

### 页面交互（需先 `cdt snapshot` 获取 uid）

```bash
cdt snapshot                # 1. 先获取快照，找到目标元素的 uid
cdt click <uid>             # 2. 点击元素
cdt fill <uid> "hello"      # 填写输入框
cdt type "search text" Enter  # 键入文本并按 Enter
cdt key "Control+A"         # 按键组合
cdt wait "登录成功"          # 等待文本出现
```

### 网络调试

```bash
cdt network                 # 列出所有网络请求
cdt request 3               # 获取第 3 个请求的详情（含 body）
```

### 性能 & 审计

```bash
cdt perf_start              # 开始性能录制（自动 reload + autoStop）
cdt perf_stop /tmp/trace.json.gz  # 手动停止并保存 trace
cdt audit /tmp/report       # Lighthouse 审计（可访问性、SEO、最佳实践）
```

### 模拟

```bash
cdt emulate --colorScheme dark                  # 暗色模式
cdt emulate --networkConditions "Slow 3G"       # 慢速网络
cdt emulate --viewport "375x667x2,mobile,touch" # 模拟 iPhone
```

### 高级：直接调用底层命令

```bash
cdt raw navigate_page --url "https://..." --timeout 30000
cdt raw take_screenshot --format webp --quality 80
cdt raw emulate --geolocation "37.7749x-122.4194"
```

## 执行流程

当用户要求浏览器操作时，按以下流程执行：

### 1. 确保守护进程

无需手动启动——`cdt` 的所有命令会自动检测并启动守护进程。

### 2. 导航

```bash
cdt goto <目标URL>
```

### 3. 获取页面状态

根据需要选择：
- `cdt snapshot` — 获取 a11y tree（推荐，信息量大且快）
- `cdt screenshot /tmp/page.png` — 截图查看视觉效果
- `cdt title` / `cdt url` — 快速确认页面

### 4. 交互操作

如需与页面交互：
1. **先 `cdt snapshot`** 获取页面元素及其 uid
2. 用 `cdt click <uid>` / `cdt fill <uid> <value>` 操作元素
3. 操作后再次 `cdt snapshot` 确认结果

### 5. 调试信息

- **JS 错误/日志** → `cdt console`
- **接口问题** → `cdt network` + `cdt request <reqid>`
- **性能问题** → `cdt perf_start` → 等待 → `cdt perf_stop`
- **可访问性/SEO** → `cdt audit`

### 6. 汇报结果

完成后简要说明执行了什么操作和结果。如有截图，告知保存路径。

## 常见工作流示例

### 验证页面是否正常加载

```bash
cdt goto http://localhost:5173
cdt title
cdt screenshot /tmp/homepage.png
cdt console   # 检查有无报错
```

### 表单自动填写

```bash
cdt goto http://localhost:5173/login
cdt snapshot                    # 获取 uid
cdt fill uid_username "admin"
cdt fill uid_password "123456"
cdt click uid_submit
cdt wait "Dashboard"
cdt screenshot /tmp/after-login.png
```

### 性能分析

```bash
cdt goto https://example.com
cdt perf_start
# 自动 reload + trace
cdt perf_stop /tmp/perf-trace.json.gz
```

### E2E 回归检查

```bash
cdt goto http://localhost:5173
cdt screenshot /tmp/before.png
# ... 执行一些操作 ...
cdt screenshot /tmp/after.png
```

## 注意事项

- uid 是动态的——每次 `snapshot` 后的 uid 可能变化，**始终用最新 snapshot 的 uid**
- headless 模式下最大分辨率 3840x2160
- 截图默认保存为 PNG，可通过 `cdt raw take_screenshot --format webp` 改格式
- 守护进程使用 isolated 临时配置目录，关闭后自动清理
- 如需持久化浏览器状态（如登录态），使用 `cdt start --isolated=false`

## 底层工具完整列表

| 快捷命令 | 底层 CLI 命令 | 说明 |
|---------|-------------|------|
| `goto` | `navigate_page --url` | 导航 |
| `back/forward/reload` | `navigate_page --type` | 历史导航 |
| `screenshot/ss` | `take_screenshot` | 截图 |
| `fullshot/fs` | `take_screenshot --fullPage` | 全页截图 |
| `snapshot/snap` | `take_snapshot` | a11y tree |
| `eval/js` | `evaluate_script` | 执行 JS |
| `click` | `click` | 点击 |
| `fill` | `fill` | 填写 |
| `type` | `type_text` | 输入文本 |
| `key` | `press_key` | 按键 |
| `console` | `list_console_messages` | 控制台 |
| `network/net` | `list_network_requests` | 网络请求列表 |
| `request/req` | `get_network_request` | 请求详情 |
| `pages` | `list_pages` | 标签页列表 |
| `select/sel` | `select_page` | 切换页面 |
| `newtab/new` | `new_page` | 新标签页 |
| `close` | `close_page` | 关闭标签页 |
| `audit` | `lighthouse_audit` | 审计 |
| `perf_start` | `performance_start_trace` | 性能录制 |
| `perf_stop` | `performance_stop_trace` | 停止录制 |
| `emulate/emu` | `emulate` | 模拟 |
| `wait` | `wait_for` | 等待文本 |
| `raw` | 透传 | 任意命令 |
