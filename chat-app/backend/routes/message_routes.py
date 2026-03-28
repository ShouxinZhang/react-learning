from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import ChatMember, Message, User
from schemas import MessageOut

router = APIRouter(tags=["messages"])


@router.get("/chats/{chat_id}/messages", response_model=list[MessageOut])
async def get_messages(
    chat_id: int,
    before: Optional[int] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify membership
    membership = await db.execute(
        select(ChatMember).where(
            ChatMember.chat_id == chat_id,
            ChatMember.user_id == current_user.id,
        )
    )
    if not membership.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this chat")

    stmt = (
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    if before is not None:
        stmt = stmt.where(Message.id < before)

    result = await db.execute(stmt)
    messages = result.scalars().all()

    # Collect sender nicknames
    sender_ids = {m.sender_id for m in messages}
    if sender_ids:
        users_result = await db.execute(select(User).where(User.id.in_(sender_ids)))
        nick_map = {u.id: u.nickname for u in users_result.scalars().all()}
    else:
        nick_map = {}

    return [
        MessageOut(
            id=msg.id,
            chat_id=msg.chat_id,
            sender_id=msg.sender_id,
            content=msg.content,
            type=msg.type,
            created_at=msg.created_at,
            sender_nickname=nick_map.get(msg.sender_id),
        )
        for msg in messages
    ]
