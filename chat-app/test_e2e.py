#!/usr/bin/env python3
"""
E2E integration test for Chat App.
Tests the full API flow against a running backend.

Usage:  python test_e2e.py [--base-url http://localhost:8000]
"""
import argparse
import json
import subprocess
import sys
import time

BASE = "http://localhost:8000"
PASSED = 0
FAILED = 0


def api(method, path, data=None, token=None):
    cmd = ["curl", "-s", "-w", "\n%{http_code}", "-X", method, f"{BASE}{path}",
           "-H", "Content-Type: application/json"]
    if token:
        cmd += ["-H", f"Authorization: Bearer {token}"]
    if data:
        cmd += ["-d", json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    parts = r.stdout.rsplit("\n", 1)
    body = parts[0] if len(parts) > 1 else ""
    code = int(parts[-1]) if parts[-1].isdigit() else 0
    try:
        parsed = json.loads(body)
    except (json.JSONDecodeError, ValueError):
        parsed = body
    return code, parsed


def check(name, condition, detail=""):
    global PASSED, FAILED
    if condition:
        PASSED += 1
        print(f"  \033[32m✓\033[0m {name}")
    else:
        FAILED += 1
        print(f"  \033[31m✗\033[0m {name} {detail}")


def main():
    global BASE
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000")
    args = parser.parse_args()
    BASE = args.base_url

    ts = str(int(time.time()))

    print("\n── 1. Health Check ──")
    code, body = api("GET", "/api/health")
    check("GET /health → 200", code == 200)

    print("\n── 2. Registration ──")
    code, d = api("POST", "/api/register", {
        "username": f"alice_{ts}", "password": "123456", "nickname": "Alice"
    })
    check("Register Alice → 200", code == 200)
    token_a = d.get("token", "") if isinstance(d, dict) else ""
    user_a = d.get("user", {}) if isinstance(d, dict) else {}

    code, d = api("POST", "/api/register", {
        "username": f"bob_{ts}", "password": "123456", "nickname": "Bob"
    })
    check("Register Bob → 200", code == 200)
    token_b = d.get("token", "") if isinstance(d, dict) else ""
    user_b = d.get("user", {}) if isinstance(d, dict) else {}
    bid = user_b.get("id", 0)

    code, d = api("POST", "/api/register", {
        "username": f"charlie_{ts}", "password": "123456", "nickname": "Charlie"
    })
    check("Register Charlie → 200", code == 200)
    user_c = d.get("user", {}) if isinstance(d, dict) else {}
    cid_user = user_c.get("id", 0)

    # Duplicate
    code, _ = api("POST", "/api/register", {
        "username": f"alice_{ts}", "password": "654321", "nickname": "X"
    })
    check("Duplicate username → 409", code == 409)

    # Validation
    code, _ = api("POST", "/api/register", {
        "username": "ab", "password": "123456", "nickname": "X"
    })
    check("Short username → 400", code == 400)

    code, _ = api("POST", "/api/register", {
        "username": f"valid_{ts}", "password": "123", "nickname": "X"
    })
    check("Short password → 400", code == 400)

    print("\n── 3. Login ──")
    code, d = api("POST", "/api/login", {
        "username": f"alice_{ts}", "password": "123456"
    })
    check("Login Alice → 200", code == 200)
    check("Login returns token", "token" in d if isinstance(d, dict) else False)

    code, _ = api("POST", "/api/login", {
        "username": f"alice_{ts}", "password": "wrongpw"
    })
    check("Wrong password → 401", code == 401)

    code, _ = api("POST", "/api/login", {"username": "nonexistent", "password": "x"})
    check("Nonexistent user → 401", code == 401)

    print("\n── 4. Auth (/me) ──")
    code, d = api("GET", "/api/me", token=token_a)
    check("GET /me → 200", code == 200)
    check("/me returns correct user", isinstance(d, dict) and d.get("username", "").startswith("alice"))

    code, _ = api("GET", "/api/me")
    check("GET /me no token → 401/403", code in (401, 403))

    code, _ = api("GET", "/api/me", token="invalid.jwt.token")
    check("GET /me bad token → 401/403", code in (401, 403))

    print("\n── 5. User Search ──")
    code, d = api("GET", f"/api/users/search?q=bob_{ts}", token=token_a)
    check("Search Bob → 200", code == 200)
    check("Search finds Bob", isinstance(d, list) and len(d) >= 1)

    code, d = api("GET", f"/api/users/search?q=alice_{ts}", token=token_a)
    check("Search excludes self", isinstance(d, list) and len(d) == 0)

    code, d = api("GET", "/api/users/search?q=zzzznonexist", token=token_a)
    check("Search no results → empty list", isinstance(d, list) and len(d) == 0)

    print("\n── 6. Private Chat ──")
    code, d = api("POST", "/api/chats", {"user_id": bid}, token=token_a)
    check("Create private chat → 200", code == 200)
    chat_id = d.get("id", 0) if isinstance(d, dict) else 0
    check("Chat type=private", isinstance(d, dict) and d.get("type") == "private")
    check("Chat has 2 members", isinstance(d, dict) and len(d.get("members", [])) == 2)

    # Idempotent
    code, d2 = api("POST", "/api/chats", {"user_id": bid}, token=token_a)
    check("Idempotent → same id", isinstance(d2, dict) and d2.get("id") == chat_id)

    # Self chat
    code, _ = api("POST", "/api/chats", {"user_id": user_a.get("id", 0)}, token=token_a)
    check("Self chat → 400", code == 400)

    # Nonexistent user
    code, _ = api("POST", "/api/chats", {"user_id": 99999}, token=token_a)
    check("Chat with nonexistent → 404", code == 404)

    print("\n── 7. Group Chat ──")
    code, d = api("POST", "/api/chats/group", {
        "name": f"TestGroup_{ts}", "member_ids": [bid, cid_user]
    }, token=token_a)
    check("Create group → 200", code == 200)
    group_id = d.get("id", 0) if isinstance(d, dict) else 0
    check("Group type=group", isinstance(d, dict) and d.get("type") == "group")
    check("Group has 3 members", isinstance(d, dict) and len(d.get("members", [])) == 3)

    code, _ = api("POST", "/api/chats/group", {
        "name": "", "member_ids": [bid]
    }, token=token_a)
    check("Empty group name → 400", code == 400)

    print("\n── 8. Chat List ──")
    code, d = api("GET", "/api/chats", token=token_a)
    check("List chats → 200", code == 200)
    check("Has ≥2 chats", isinstance(d, list) and len(d) >= 2)

    print("\n── 9. Messages ──")
    code, d = api("GET", f"/api/chats/{chat_id}/messages", token=token_a)
    check("Get messages → 200", code == 200)
    check("Messages initially empty", isinstance(d, list) and len(d) == 0)

    # Non-member access
    code_c, d_c = api("POST", "/api/register", {
        "username": f"outsider_{ts}", "password": "123456", "nickname": "Outsider"
    })
    tok_o = d_c.get("token", "") if isinstance(d_c, dict) else ""
    code, _ = api("GET", f"/api/chats/{chat_id}/messages", token=tok_o)
    check("Non-member → 403", code == 403)

    print("\n── 10. Group Members ──")
    code, d = api("GET", f"/api/chats/{group_id}/members", token=token_a)
    check("Get members → 200", code == 200)
    check("Members list has entries", isinstance(d, list) and len(d) >= 2)

    # Summary
    total = PASSED + FAILED
    print(f"\n{'='*50}")
    if FAILED == 0:
        print(f"\033[32m  ALL {total} TESTS PASSED\033[0m")
    else:
        print(f"\033[31m  {FAILED} FAILED\033[0m / {total} total")
    print(f"{'='*50}\n")

    return 0 if FAILED == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
