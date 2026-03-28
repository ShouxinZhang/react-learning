import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from conftest import register_user, auth_header


# ── Private chat ──

async def test_create_private_chat(client):
    _, tok_a = await register_user(client, "alice", "123456", "Alice")
    ub, _ = await register_user(client, "bob", "123456", "Bob")
    resp = await client.post("/api/chats", json={"user_id": ub["id"]}, headers=auth_header(tok_a))
    assert resp.status_code == 200
    d = resp.json()
    assert d["type"] == "private"
    assert len(d["members"]) == 2


async def test_create_private_chat_self(client):
    ua, tok_a = await register_user(client, "alice", "123456", "Alice")
    resp = await client.post("/api/chats", json={"user_id": ua["id"]}, headers=auth_header(tok_a))
    assert resp.status_code == 400


async def test_private_chat_idempotent(client):
    _, tok = await register_user(client, "alice", "123456", "Alice")
    ub, _ = await register_user(client, "bob", "123456", "Bob")
    r1 = await client.post("/api/chats", json={"user_id": ub["id"]}, headers=auth_header(tok))
    r2 = await client.post("/api/chats", json={"user_id": ub["id"]}, headers=auth_header(tok))
    assert r1.json()["id"] == r2.json()["id"]


async def test_private_chat_nonexistent_user(client):
    _, tok = await register_user(client, "alice", "123456", "Alice")
    resp = await client.post("/api/chats", json={"user_id": 9999}, headers=auth_header(tok))
    assert resp.status_code == 404


# ── List chats ──

async def test_list_chats_empty(client):
    _, tok = await register_user(client, "alice", "123456", "Alice")
    resp = await client.get("/api/chats", headers=auth_header(tok))
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_chats_has_items(client):
    _, tok = await register_user(client, "alice", "123456", "Alice")
    ub, _ = await register_user(client, "bob", "123456", "Bob")
    await client.post("/api/chats", json={"user_id": ub["id"]}, headers=auth_header(tok))
    resp = await client.get("/api/chats", headers=auth_header(tok))
    assert len(resp.json()) == 1


# ── Group ──

async def test_create_group(client):
    _, tok = await register_user(client, "alice", "123456", "Alice")
    ub, _ = await register_user(client, "bob", "123456", "Bob")
    uc, _ = await register_user(client, "charlie", "123456", "Charlie")
    resp = await client.post("/api/chats/group", json={
        "name": "Team", "member_ids": [ub["id"], uc["id"]],
    }, headers=auth_header(tok))
    assert resp.status_code == 200
    d = resp.json()
    assert d["type"] == "group"
    assert d["name"] == "Team"
    assert len(d["members"]) == 3


async def test_create_group_empty_name(client):
    _, tok = await register_user(client, "alice", "123456", "Alice")
    ub, _ = await register_user(client, "bob", "123456", "Bob")
    resp = await client.post("/api/chats/group", json={
        "name": "", "member_ids": [ub["id"]],
    }, headers=auth_header(tok))
    assert resp.status_code == 400
