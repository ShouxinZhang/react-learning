---
name: token-count
description: "统计文件的 token 数量。Use when: 需要估算文件 token 消耗、检查 context window 占用、分析文档大小、token counting、token 统计。"
argument-hint: "指定要统计 token 的文件路径"
---

# Token 统计

统计指定文件的 token 数量，支持多种编码模型的 token 计数。

## 适用场景

- 估算文件在 LLM context window 中的 token 占用
- 对比不同文件的 token 大小
- 检查 prompt / 文档是否超出 token 限制

## 使用步骤

1. 确定要统计的文件路径（支持单个或多个文件）
2. 运行 [token 统计脚本](./scripts/count_tokens.py)：
   ```bash
   python .github/skills/token-count/scripts/count_tokens.py <file_path> [file_path2 ...]
   ```
3. 可选参数：
   - `--encoding`：指定 tiktoken 编码，默认 `o200k_base`（GPT-4o / o1 / o3 系列）
     - `o200k_base`：GPT-4o、o1、o3 系列
     - `cl100k_base`：GPT-4、GPT-3.5-turbo、text-embedding-ada-002
   - `--json`：以 JSON 格式输出结果
4. 汇报统计结果，包含：字符数、单词数、行数、token 数

## 输出示例

```
📊 Token 统计结果
═══════════════════════════════════════
📄 文件: chat-app/PLAN.md
   字符数:   3,842
   单词数:     456
   行数:       120
   Token 数:  1,523  (o200k_base)
═══════════════════════════════════════
```
