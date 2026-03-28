"""WebSocket tests use Starlette's sync TestClient."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from conftest import auth_header
import pytest
from starlette.testclient import TestClient


def _reg(client: TestClient, username, password="123456", nickname=None):
    nn = nickname or username.capitalize()
    r = client.post("/api/register", json={"username": username, "password": password, "nickname": nn})
    assert r.status_code == 200, r.text
    d = r.json()
    return d["user"], d["token"]


def test_ws_valid_token(app):
    from websocket.manager import manager
    manager.active_connections.clear()

    with TestClient(app) as c:
        u, tok = _reg(c, "alice")
        with c.websocket_connect(f"/ws?token={tok}") as ws:
            data = ws.receive_json()
            assert data["type"] == "online_users"


def test_ws_invalid_token(app):
    with TestClient(app) as c:
        with pytest.raises(Exception):
            with c.websocket_connect("/ws?token=bad.jwt.value") as ws:
                ws.receive_json()


def test_ws_connect_disconnect(app):
    """Test that WS connect and disconnect work without errors."""
    from websocket.manager import manager
    manager.active_connections.clear()

    with TestClient(app) as c:
        _ua, ta = _reg(c, "alice")

        with c.websocket_connect(f"/ws?token={ta}") as ws_a:
            data = ws_a.receive_json()
            assert data["type"] == "online_users"
        # After exiting the context, alice should be disconnected
        assert _ua["id"] not in manager.active_connections
