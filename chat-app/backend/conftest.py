import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession


@pytest_asyncio.fixture()
async def app():
    """Create a fresh app with in-memory DB for each test."""
    from database import Base

    db_name = f"test_{uuid.uuid4().hex[:8]}"
    test_db_url = f"sqlite+aiosqlite:///file:{db_name}?mode=memory&cache=shared&uri=true"
    engine = create_async_engine(test_db_url, echo=False)
    test_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        from models import User, Chat, ChatMember, Message  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

    import database
    import websocket.manager as ws_mgr
    import websocket.handler as ws_hdl
    orig = (database.async_session, ws_mgr.async_session, ws_hdl.async_session)

    async def override_get_db():
        async with test_session() as session:
            yield session

    database.async_session = test_session
    ws_mgr.async_session = test_session
    ws_hdl.async_session = test_session

    from server import app as fastapi_app
    from database import get_db
    fastapi_app.dependency_overrides[get_db] = override_get_db

    yield fastapi_app

    fastapi_app.dependency_overrides.clear()
    database.async_session, ws_mgr.async_session, ws_hdl.async_session = orig
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture()
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── Helpers (importable by tests) ──

async def register_user(client: AsyncClient, username="alice", password="123456", nickname="Alice"):
    resp = await client.post("/api/register", json={
        "username": username, "password": password, "nickname": nickname,
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    return data["user"], data["token"]


def auth_header(token: str):
    return {"Authorization": f"Bearer {token}"}
