from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select
from database import async_session
from auth import decode_token
from models import Message, ChatMember, User
from websocket.manager import manager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    # Authenticate
    user_id = decode_token(token)
    if user_id is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(websocket, user_id)

    # Send current online users to the newly connected user
    await websocket.send_json({
        "type": "online_users",
        "user_ids": list(manager.get_online_users()),
    })

    # Broadcast presence online to all other connected users
    for uid in manager.get_online_users():
        if uid != user_id:
            await manager.send_to_user(uid, {
                "type": "presence",
                "user_id": user_id,
                "online": True,
            })

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "message":
                chat_id = data.get("chat_id")
                content = data.get("content", "").strip()
                if not chat_id or not content:
                    await websocket.send_json({"type": "error", "detail": "Missing chat_id or content"})
                    continue

                # Verify user is member of chat
                async with async_session() as session:
                    member_check = await session.execute(
                        select(ChatMember).where(
                            ChatMember.chat_id == chat_id,
                            ChatMember.user_id == user_id
                        )
                    )
                    if not member_check.scalar_one_or_none():
                        await websocket.send_json({"type": "error", "detail": "Not a member of this chat"})
                        continue

                    # Save message
                    msg = Message(chat_id=chat_id, sender_id=user_id, content=content, type="text")
                    session.add(msg)
                    await session.commit()
                    await session.refresh(msg)

                    # Get sender nickname
                    user_result = await session.execute(select(User.nickname).where(User.id == user_id))
                    sender_nickname = user_result.scalar_one()

                # Broadcast to chat members
                msg_out = {
                    "id": msg.id,
                    "chat_id": msg.chat_id,
                    "sender_id": msg.sender_id,
                    "content": msg.content,
                    "type": msg.type,
                    "created_at": msg.created_at.isoformat(),
                    "sender_nickname": sender_nickname,
                }
                await manager.send_to_chat(chat_id, {"type": "new_message", "message": msg_out}, exclude_user_id=None)

            elif msg_type == "typing":
                chat_id = data.get("chat_id")
                if chat_id:
                    # Forward to other members
                    await manager.send_to_chat(chat_id, {
                        "type": "typing",
                        "chat_id": chat_id,
                        "user_id": user_id,
                    }, exclude_user_id=user_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        for uid in manager.get_online_users():
            await manager.send_to_user(uid, {
                "type": "presence",
                "user_id": user_id,
                "online": False,
            })
    except Exception:
        manager.disconnect(user_id)
        for uid in manager.get_online_users():
            await manager.send_to_user(uid, {
                "type": "presence",
                "user_id": user_id,
                "online": False,
            })
