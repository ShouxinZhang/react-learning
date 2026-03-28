import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from conftest import register_user, auth_header


async def test_messages_empty(client):
    _, tok_a = await register_user(client, "alice", "123456", "Alice")
    ub, _ = await register_user(client, "bob", "123456", "Bob")
    cr = await client.post("/api/chats", json={"user_id": ub["id"]}, headers=auth_header(tok_a))
    cid = cr.json()["id"]
    resp = await client.get(f"/api/chats/{cid}/messages", headers=auth_header(tok_a))
    assert resp.status_code == 200
    assert resp.json() == []


async def test_messages_non_member(client):
    _, tok_a = await register_user(client, "alice", "123456", "Alice")
    ub, _ = await register_user(client, "bob", "123456", "Bob")
    _, tok_c = await register_user(client, "charlie", "123456", "Charlie")
    cr = await client.post("/api/chats", json={"user_id": ub["id"]}, headers=auth_header(tok_a))
    cid = cr.json()["id"]
    resp = await client.get(f"/api/chats/{cid}/messages", headers=auth_header(tok_c))
    assert resp.status_code == 403
