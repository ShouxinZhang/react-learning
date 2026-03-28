import sys
from pathlib import Path

# Ensure conftest helpers are importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from conftest import register_user, auth_header


# ── Register ──

async def test_register_success(client):
    resp = await client.post("/api/register", json={
        "username": "alice", "password": "123456", "nickname": "Alice",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["username"] == "alice"


async def test_register_duplicate(client):
    await register_user(client, "dup", "123456", "Dup")
    resp = await client.post("/api/register", json={
        "username": "dup", "password": "654321", "nickname": "Dup2",
    })
    assert resp.status_code == 409


async def test_register_short_username(client):
    resp = await client.post("/api/register", json={
        "username": "ab", "password": "123456", "nickname": "X",
    })
    assert resp.status_code == 400


async def test_register_special_chars(client):
    resp = await client.post("/api/register", json={
        "username": "al!ce@#", "password": "123456", "nickname": "X",
    })
    assert resp.status_code == 400


async def test_register_short_password(client):
    resp = await client.post("/api/register", json={
        "username": "charlie", "password": "123", "nickname": "Charlie",
    })
    assert resp.status_code == 400


# ── Login ──

async def test_login_success(client):
    await register_user(client, "dave", "pass1234", "Dave")
    resp = await client.post("/api/login", json={
        "username": "dave", "password": "pass1234",
    })
    assert resp.status_code == 200
    assert "token" in resp.json()


async def test_login_wrong_password(client):
    await register_user(client, "eve", "rightpw", "Eve")
    resp = await client.post("/api/login", json={
        "username": "eve", "password": "wrongpw",
    })
    assert resp.status_code == 401


async def test_login_nonexistent(client):
    resp = await client.post("/api/login", json={
        "username": "nobody", "password": "123456",
    })
    assert resp.status_code == 401


# ── /me ──

async def test_me_ok(client):
    _, token = await register_user(client, "frank", "123456", "Frank")
    resp = await client.get("/api/me", headers=auth_header(token))
    assert resp.status_code == 200
    assert resp.json()["username"] == "frank"


async def test_me_no_token(client):
    resp = await client.get("/api/me")
    assert resp.status_code in (401, 403)
