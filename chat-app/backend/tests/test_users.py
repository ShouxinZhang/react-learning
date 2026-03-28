import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from conftest import register_user, auth_header


async def test_search_found(client):
    _, token = await register_user(client, "alice", "123456", "Alice")
    await register_user(client, "bob", "123456", "Bob")
    resp = await client.get("/api/users/search", params={"q": "bob"}, headers=auth_header(token))
    assert resp.status_code == 200
    assert any(u["username"] == "bob" for u in resp.json())


async def test_search_excludes_self(client):
    _, token = await register_user(client, "alice", "123456", "Alice")
    resp = await client.get("/api/users/search", params={"q": "alice"}, headers=auth_header(token))
    assert resp.status_code == 200
    assert len(resp.json()) == 0


async def test_search_no_results(client):
    _, token = await register_user(client, "alice", "123456", "Alice")
    resp = await client.get("/api/users/search", params={"q": "zzzzz"}, headers=auth_header(token))
    assert resp.status_code == 200
    assert resp.json() == []


async def test_search_no_auth(client):
    resp = await client.get("/api/users/search", params={"q": "x"})
    assert resp.status_code in (401, 403)
