from fastapi import WebSocket
from sqlalchemy import select
from database import async_session


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)

    def is_online(self, user_id: int) -> bool:
        return user_id in self.active_connections

    def get_online_users(self) -> set[int]:
        return set(self.active_connections.keys())

    async def send_to_user(self, user_id: int, data: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(user_id)

    async def send_to_chat(self, chat_id: int, data: dict, exclude_user_id: int | None = None):
        from models import ChatMember
        async with async_session() as session:
            result = await session.execute(
                select(ChatMember.user_id).where(ChatMember.chat_id == chat_id)
            )
            member_ids = [row[0] for row in result.fetchall()]

        for uid in member_ids:
            if uid != exclude_user_id:
                await self.send_to_user(uid, data)


manager = ConnectionManager()
