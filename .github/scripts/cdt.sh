#!/usr/bin/env bash
# chrome-devtools CLI wrapper (cdt)
# 简化 chrome-devtools CLI 的常用操作为简短命令
# 用法: cdt <command> [args...]
#
# 依赖: npm install -g chrome-devtools-mcp@latest
# 守护进程: 自动管理 (首次调用自动 start)

set -euo pipefail

CDT="npx -y chrome-devtools-mcp@latest"
CDT_CLI="npx chrome-devtools"

# ──────────────────── 守护进程管理 ────────────────────

_ensure_daemon() {
  if ! $CDT_CLI status &>/dev/null; then
    echo "[cdt] 正在启动 chrome-devtools 守护进程 (headless + isolated)..."
    $CDT_CLI start --headless --isolated --no-usage-statistics 2>&1
    sleep 1
  fi
}

# ──────────────────── 快捷命令 ────────────────────

cmd_start() {
  echo "[cdt] 启动守护进程..."
  local extra_args=("$@")
  $CDT_CLI start --headless --isolated --no-usage-statistics "${extra_args[@]}" 2>&1
}

cmd_stop() {
  $CDT_CLI stop
  echo "[cdt] 守护进程已停止"
}

cmd_status() {
  $CDT_CLI status
}

# 导航到 URL
cmd_goto() {
  local url="${1:?用法: cdt goto <url>}"
  _ensure_daemon
  $CDT_CLI navigate_page --url "$url"
}

# 截图
cmd_screenshot() {
  local file="${1:-/tmp/cdt-screenshot-$(date +%s).png}"
  _ensure_daemon
  $CDT_CLI take_screenshot --filePath "$file" --format png
  echo "[cdt] 截图已保存: $file"
}

# 全页截图
cmd_fullshot() {
  local file="${1:-/tmp/cdt-fullpage-$(date +%s).png}"
  _ensure_daemon
  $CDT_CLI take_screenshot --filePath "$file" --format png --fullPage
  echo "[cdt] 全页截图已保存: $file"
}

# 执行 JS
cmd_eval() {
  local script="${1:?用法: cdt eval '<js函数>'}"
  _ensure_daemon
  $CDT_CLI evaluate_script "$script"
}

# 获取页面标题
cmd_title() {
  _ensure_daemon
  $CDT_CLI evaluate_script "() => document.title"
}

# 获取页面 URL
cmd_url() {
  _ensure_daemon
  $CDT_CLI evaluate_script "() => window.location.href"
}

# 获取页面文本快照 (a11y tree)
cmd_snapshot() {
  local file="${1:-}"
  _ensure_daemon
  if [[ -n "$file" ]]; then
    $CDT_CLI take_snapshot --filePath "$file"
    echo "[cdt] 快照已保存: $file"
  else
    $CDT_CLI take_snapshot
  fi
}

# 列出控制台消息
cmd_console() {
  _ensure_daemon
  $CDT_CLI list_console_messages
}

# 列出网络请求
cmd_network() {
  _ensure_daemon
  $CDT_CLI list_network_requests
}

# 获取特定网络请求详情
cmd_request() {
  local reqid="${1:?用法: cdt request <reqid>}"
  _ensure_daemon
  $CDT_CLI get_network_request --reqid "$reqid"
}

# 列出打开的页面
cmd_pages() {
  _ensure_daemon
  $CDT_CLI list_pages
}

# 切换到指定页面
cmd_select() {
  local page_id="${1:?用法: cdt select <pageId>}"
  _ensure_daemon
  $CDT_CLI select_page "$page_id"
}

# 新建标签页
cmd_newtab() {
  local url="${1:?用法: cdt newtab <url>}"
  _ensure_daemon
  $CDT_CLI new_page "$url"
}

# 关闭标签页
cmd_close() {
  local page_id="${1:?用法: cdt close <pageId>}"
  _ensure_daemon
  $CDT_CLI close_page "$page_id"
}

# 点击元素
cmd_click() {
  local uid="${1:?用法: cdt click <uid>}"
  _ensure_daemon
  $CDT_CLI click "$uid"
}

# 填写元素
cmd_fill() {
  local uid="${1:?用法: cdt fill <uid> <value>}"
  local value="${2:?用法: cdt fill <uid> <value>}"
  _ensure_daemon
  $CDT_CLI fill "$uid" "$value"
}

# 按键
cmd_key() {
  local key="${1:?用法: cdt key <key>  例: Enter, Control+A}"
  _ensure_daemon
  $CDT_CLI press_key "$key"
}

# 打字到已聚焦输入框
cmd_type() {
  local text="${1:?用法: cdt type <text> [submitKey]}"
  local submit_key="${2:-}"
  _ensure_daemon
  if [[ -n "$submit_key" ]]; then
    $CDT_CLI type_text "$text" --submitKey "$submit_key"
  else
    $CDT_CLI type_text "$text"
  fi
}

# 等待文本出现
cmd_wait() {
  local text="${1:?用法: cdt wait <text>}"
  _ensure_daemon
  $CDT_CLI wait_for "$text"
}

# Lighthouse 审计
cmd_audit() {
  local dir="${1:-/tmp/cdt-audit-$(date +%s)}"
  _ensure_daemon
  $CDT_CLI lighthouse_audit --outputDirPath "$dir"
  echo "[cdt] Lighthouse 报告已保存: $dir"
}

# 性能录制 (开始)
cmd_perf_start() {
  _ensure_daemon
  $CDT_CLI performance_start_trace --reload --autoStop
}

# 性能录制 (停止)
cmd_perf_stop() {
  local file="${1:-/tmp/cdt-trace-$(date +%s).json.gz}"
  _ensure_daemon
  $CDT_CLI performance_stop_trace --filePath "$file"
  echo "[cdt] Trace 已保存: $file"
}

# 模拟设备/网络
cmd_emulate() {
  _ensure_daemon
  $CDT_CLI emulate "$@"
}

# 后退
cmd_back() {
  _ensure_daemon
  $CDT_CLI navigate_page --type back
}

# 前进
cmd_forward() {
  _ensure_daemon
  $CDT_CLI navigate_page --type forward
}

# 刷新
cmd_reload() {
  _ensure_daemon
  $CDT_CLI navigate_page --type reload
}

# 直接透传给 chrome-devtools CLI
cmd_raw() {
  _ensure_daemon
  $CDT_CLI "$@"
}

# ──────────────────── 帮助 ────────────────────

cmd_help() {
  cat <<'EOF'
cdt - Chrome DevTools CLI 快捷工具

守护进程:
  cdt start [flags]         启动守护进程 (默认 headless + isolated)
  cdt stop                  停止守护进程
  cdt status                查看守护进程状态

导航:
  cdt goto <url>            导航到 URL
  cdt back                  后退
  cdt forward               前进
  cdt reload                刷新页面

页面管理:
  cdt pages                 列出所有标签页
  cdt select <pageId>       切换到指定标签页
  cdt newtab <url>          新建标签页
  cdt close <pageId>        关闭标签页

截图 & 快照:
  cdt screenshot [file]     截图 (默认保存到 /tmp/)
  cdt fullshot [file]       全页截图
  cdt snapshot [file]       页面文本快照 (a11y tree)

输入:
  cdt click <uid>           点击元素 (uid 来自 snapshot)
  cdt fill <uid> <value>    填写表单元素
  cdt type <text> [key]     键入文本 (可选提交键如 Enter)
  cdt key <key>             按键 (如 Enter, Control+A)

信息获取:
  cdt title                 获取页面标题
  cdt url                   获取当前 URL
  cdt console               列出控制台消息
  cdt network               列出网络请求
  cdt request <reqid>       获取特定网络请求详情
  cdt eval '<js>'           执行 JS 函数

性能 & 审计:
  cdt audit [dir]           Lighthouse 审计
  cdt perf_start            开始性能录制
  cdt perf_stop [file]      停止性能录制并保存 trace
  cdt emulate [flags]       模拟设备/网络/主题

高级:
  cdt raw <command> [args]  直接透传给 chrome-devtools CLI
  cdt wait <text>           等待文本出现在页面上
  cdt help                  显示此帮助

示例:
  cdt goto https://example.com
  cdt screenshot /tmp/page.png
  cdt eval "() => document.querySelectorAll('a').length"
  cdt snapshot /tmp/page-tree.txt
  cdt emulate --colorScheme dark --networkConditions "Slow 3G"
EOF
}

# ──────────────────── 主入口 ────────────────────

main() {
  local cmd="${1:-help}"
  shift 2>/dev/null || true

  case "$cmd" in
    start)      cmd_start "$@" ;;
    stop)       cmd_stop ;;
    status)     cmd_status ;;
    goto|nav)   cmd_goto "$@" ;;
    back)       cmd_back ;;
    forward)    cmd_forward ;;
    reload)     cmd_reload ;;
    screenshot|ss)  cmd_screenshot "$@" ;;
    fullshot|fs)    cmd_fullshot "$@" ;;
    snapshot|snap)  cmd_snapshot "$@" ;;
    eval|js)    cmd_eval "$@" ;;
    title)      cmd_title ;;
    url)        cmd_url ;;
    console)    cmd_console ;;
    network|net)    cmd_network ;;
    request|req)    cmd_request "$@" ;;
    pages)      cmd_pages ;;
    select|sel) cmd_select "$@" ;;
    newtab|new) cmd_newtab "$@" ;;
    close)      cmd_close "$@" ;;
    click)      cmd_click "$@" ;;
    fill)       cmd_fill "$@" ;;
    type)       cmd_type "$@" ;;
    key)        cmd_key "$@" ;;
    wait)       cmd_wait "$@" ;;
    audit)      cmd_audit "$@" ;;
    perf_start) cmd_perf_start ;;
    perf_stop)  cmd_perf_stop "$@" ;;
    emulate|emu)    cmd_emulate "$@" ;;
    raw)        cmd_raw "$@" ;;
    help|-h|--help) cmd_help ;;
    *)
      echo "[cdt] 未知命令: $cmd"
      echo "运行 'cdt help' 查看可用命令"
      exit 1
      ;;
  esac
}

main "$@"
