#!/usr/bin/env python3
"""E2E integration tests for Chat App.
Requires: pip install requests websockets
Usage: python tests/e2e_test.py [--base-url http://localhost:8000]
"""
import sys
import json
import time
import asyncio
import argparse
import requests

BASE_URL = "http://localhost:8000"
PASS = 0
FAIL = 0

def test(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  ✅ {name}")
    else:
        FAIL += 1
        print(f"  ❌ {name} — {detail}")

class API:
    def __init__(self, base_url, token=None):
        self.base = base_url
        self.token = token
    
    @property
    def headers(self):
        h = {"Content-Type": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h
    
    def post(self, path, data=None):
        return requests.post(f"{self.base}{path}", json=data, headers=self.headers)
    
    def get(self, path, params=None):
        return requests.get(f"{self.base}{path}", params=params, headers=self.headers)
    
    def delete(self, path):
        return requests.delete(f"{self.base}{path}", headers=self.headers)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=BASE_URL)
    args = parser.parse_args()
    base = args.base_url

    print("\n🧪 E2E Integration Tests\n")

    # ── Health ──
    print("Health Check:")
    r = requests.get(f"{base}/api/health")
    test("GET /api/health", r.status_code == 200 and r.json()["status"] == "ok")

    # ── Auth ──
    print("\nAuth:")
    # Register A
    api_anon = API(base)
    r = api_anon.post("/api/register", {"username": "e2e_alice", "password": "pass123", "nickname": "E2E Alice"})
    test("Register alice", r.status_code == 200)
    if r.status_code == 200:
        data = r.json()
        test("Register returns user + token", "user" in data and "token" in data)
        test("User has id, username, nickname", all(k in data["user"] for k in ["id", "username", "nickname"]))
        token_a = data["token"]
        uid_a = data["user"]["id"]
    else:
        # May already exist from previous run
        r = api_anon.post("/api/login", {"username": "e2e_alice", "password": "pass123"})
        test("Login alice (already registered)", r.status_code == 200)
        data = r.json()
        token_a = data["token"]
        uid_a = data["user"]["id"]

    # Register B
    r = api_anon.post("/api/register", {"username": "e2e_bob", "password": "pass123", "nickname": "E2E Bob"})
    if r.status_code == 200:
        token_b = r.json()["token"]
        uid_b = r.json()["user"]["id"]
    else:
        r = api_anon.post("/api/login", {"username": "e2e_bob", "password": "pass123"})
        token_b = r.json()["token"]
        uid_b = r.json()["user"]["id"]
    test("Register/Login bob", token_b is not None)

    # Register C (for group tests)
    r = api_anon.post("/api/register", {"username": "e2e_carol", "password": "pass123", "nickname": "E2E Carol"})
    if r.status_code == 200:
        token_c = r.json()["token"]
        uid_c = r.json()["user"]["id"]
    else:
        r = api_anon.post("/api/login", {"username": "e2e_carol", "password": "pass123"})
        token_c = r.json()["token"]
        uid_c = r.json()["user"]["id"]

    # Duplicate register
    r = api_anon.post("/api/register", {"username": "e2e_alice", "password": "pass123", "nickname": "Dup"})
    test("Duplicate register → 409", r.status_code == 409)

    # Bad register
    r = api_anon.post("/api/register", {"username": "ab", "password": "pass123", "nickname": "Short"})
    test("Short username → 400", r.status_code == 400)

    r = api_anon.post("/api/register", {"username": "valid_user", "password": "12345", "nickname": "Short PW"})
    test("Short password → 400", r.status_code == 400)

    # Login
    r = api_anon.post("/api/login", {"username": "e2e_alice", "password": "pass123"})
    test("Login success", r.status_code == 200)

    r = api_anon.post("/api/login", {"username": "e2e_alice", "password": "wrong"})
    test("Login wrong password → 401", r.status_code == 401)

    r = api_anon.post("/api/login", {"username": "nonexistent", "password": "pass123"})
    test("Login nonexistent → 401", r.status_code == 401)

    # Me
    api_a = API(base, token_a)
    api_b = API(base, token_b)
    api_c = API(base, token_c)

    r = api_a.get("/api/me")
    test("GET /me", r.status_code == 200 and r.json()["username"] == "e2e_alice")

    r = API(base).get("/api/me")
    test("GET /me no token → 401/403", r.status_code in (401, 403))

    # ── Users ──
    print("\nUsers:")
    r = api_a.get("/api/users/search", params={"q": "e2e_bob"})
    test("Search users", r.status_code == 200 and len(r.json()) >= 1)
    test("Search excludes self", all(u["id"] != uid_a for u in r.json()))

    r = api_a.get("/api/users/search", params={"q": "zzz_nonexistent_zzz"})
    test("Search no results", r.status_code == 200 and len(r.json()) == 0)

    # ── Chats ──
    print("\nChats:")
    # Private chat
    r = api_a.post("/api/chats", {"user_id": uid_b})
    test("Create private chat", r.status_code == 200 and r.json()["type"] == "private")
    chat_id = r.json()["id"]
    test("Private chat has 2 members", len(r.json()["members"]) == 2)

    # Idempotent
    r2 = api_a.post("/api/chats", {"user_id": uid_b})
    test("Private chat idempotent", r2.status_code == 200 and r2.json()["id"] == chat_id)

    # Self chat → 400
    r = api_a.post("/api/chats", {"user_id": uid_a})
    test("Self chat → 400", r.status_code == 400)

    # Nonexistent user → 404
    r = api_a.post("/api/chats", {"user_id": 99999})
    test("Chat with nonexistent → 404", r.status_code == 404)

    # List chats
    r = api_a.get("/api/chats")
    test("List chats", r.status_code == 200 and len(r.json()) >= 1)

    # Group chat
    r = api_a.post("/api/chats/group", {"name": "E2E Group", "member_ids": [uid_b, uid_c]})
    test("Create group", r.status_code == 200 and r.json()["type"] == "group")
    group_id = r.json()["id"]
    test("Group has 3 members", len(r.json()["members"]) == 3)
    test("Group name", r.json()["name"] == "E2E Group")

    # Get members
    r = api_a.get(f"/api/chats/{group_id}/members")
    test("Get group members", r.status_code == 200 and len(r.json()) == 3)

    # Add member (register D first)
    r = api_anon.post("/api/register", {"username": "e2e_dave", "password": "pass123", "nickname": "E2E Dave"})
    if r.status_code == 200:
        uid_d = r.json()["user"]["id"]
    else:
        r = api_anon.post("/api/login", {"username": "e2e_dave", "password": "pass123"})
        uid_d = r.json()["user"]["id"]

    r = api_a.post(f"/api/chats/{group_id}/members", {"user_ids": [uid_d]})
    test("Add member to group", r.status_code == 200 and r.json()["added"] == 1)

    # Remove member (alice is owner)
    r = api_a.delete(f"/api/chats/{group_id}/members/{uid_d}")
    test("Remove member", r.status_code == 200)

    # Non-owner can't remove
    r = api_b.delete(f"/api/chats/{group_id}/members/{uid_c}")
    test("Non-owner remove → 403", r.status_code == 403)

    # ── Messages ──
    print("\nMessages:")
    r = api_a.get(f"/api/chats/{chat_id}/messages")
    test("Get messages (empty)", r.status_code == 200 and len(r.json()) == 0)

    # Non-member
    r = api_c.get(f"/api/chats/{chat_id}/messages")
    test("Non-member get messages → 403", r.status_code == 403)

    # ── WebSocket ──
    print("\nWebSocket:")
    try:
        import websockets
        
        async def test_ws():
            global PASS, FAIL
            ws_url = f"ws://localhost:8000/ws?token={token_a}"
            
            # Connect with valid token
            async with websockets.connect(ws_url) as ws:
                msg = await asyncio.wait_for(ws.recv(), timeout=3)
                data = json.loads(msg)
                test("WS connect → receives online_users", data["type"] == "online_users")
            
            # Connect with invalid token
            try:
                async with websockets.connect("ws://localhost:8000/ws?token=invalid") as ws:
                    # Should be closed
                    try:
                        await asyncio.wait_for(ws.recv(), timeout=2)
                        test("WS invalid token → closed", False, "connection not closed")
                    except websockets.exceptions.ConnectionClosed as e:
                        test("WS invalid token → closed", e.code == 4001)
            except websockets.exceptions.InvalidStatus:
                test("WS invalid token → rejected", True)
            except Exception as e:
                test("WS invalid token handling", False, str(e))
            
            # Two users: send message via WS
            async with websockets.connect(f"ws://localhost:8000/ws?token={token_a}") as ws_a, \
                       websockets.connect(f"ws://localhost:8000/ws?token={token_b}") as ws_b:
                # Consume initial online_users messages
                await asyncio.wait_for(ws_a.recv(), timeout=3)
                await asyncio.wait_for(ws_b.recv(), timeout=3)
                # Consume potential presence messages
                try:
                    while True:
                        await asyncio.wait_for(ws_b.recv(), timeout=0.5)
                except asyncio.TimeoutError:
                    pass
                
                # A sends message to private chat
                await ws_a.send(json.dumps({"type": "message", "chat_id": chat_id, "content": "Hello from WS!"}))
                
                # B should receive it
                received = False
                for _ in range(10):
                    try:
                        msg = await asyncio.wait_for(ws_b.recv(), timeout=2)
                        data = json.loads(msg)
                        if data.get("type") == "new_message" and data["message"]["content"] == "Hello from WS!":
                            received = True
                            break
                    except asyncio.TimeoutError:
                        break
                test("WS message delivery", received)
        
        asyncio.run(test_ws())
    except ImportError:
        print("  ⚠️  websockets not installed, skipping WS tests")

    # ── Summary ──
    total = PASS + FAIL
    print(f"\n{'='*50}")
    print(f"Results: {PASS}/{total} passed, {FAIL} failed")
    print(f"{'='*50}\n")
    
    sys.exit(1 if FAIL > 0 else 0)

if __name__ == "__main__":
    main()
