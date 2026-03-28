#!/usr/bin/env python3
"""统计文件的 token 数量。"""

import argparse
import json
import sys
from pathlib import Path

try:
    import tiktoken
except ImportError:
    print("错误: 需要安装 tiktoken。运行: pip install tiktoken", file=sys.stderr)
    sys.exit(1)


def count_tokens(text: str, encoding_name: str = "o200k_base") -> int:
    enc = tiktoken.get_encoding(encoding_name)
    return len(enc.encode(text))


def analyze_file(filepath: str, encoding_name: str = "o200k_base") -> dict:
    path = Path(filepath)
    if not path.is_file():
        raise FileNotFoundError(f"文件不存在: {filepath}")

    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    words = text.split()
    tokens = count_tokens(text, encoding_name)

    return {
        "file": str(path),
        "characters": len(text),
        "words": len(words),
        "lines": len(lines),
        "tokens": tokens,
        "encoding": encoding_name,
    }


def print_result(result: dict) -> None:
    print()
    print("📊 Token 统计结果")
    print("═" * 50)
    print(f"📄 文件: {result['file']}")
    print(f"   字符数:   {result['characters']:>8,}")
    print(f"   单词数:   {result['words']:>8,}")
    print(f"   行数:     {result['lines']:>8,}")
    print(f"   Token 数: {result['tokens']:>8,}  ({result['encoding']})")
    print("═" * 50)


def main():
    parser = argparse.ArgumentParser(description="统计文件的 token 数量")
    parser.add_argument("files", nargs="+", help="要统计的文件路径")
    parser.add_argument(
        "--encoding",
        default="o200k_base",
        choices=["o200k_base", "cl100k_base", "p50k_base", "r50k_base"],
        help="tiktoken 编码 (默认: o200k_base)",
    )
    parser.add_argument("--json", action="store_true", dest="as_json", help="JSON 格式输出")
    args = parser.parse_args()

    results = []
    for filepath in args.files:
        try:
            result = analyze_file(filepath, args.encoding)
            results.append(result)
        except FileNotFoundError as e:
            print(f"⚠️  {e}", file=sys.stderr)
        except Exception as e:
            print(f"⚠️  处理 {filepath} 时出错: {e}", file=sys.stderr)

    if not results:
        sys.exit(1)

    if args.as_json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for r in results:
            print_result(r)
        if len(results) > 1:
            total = sum(r["tokens"] for r in results)
            print(f"\n📊 合计 Token 数: {total:,}  ({args.encoding})")


if __name__ == "__main__":
    main()
