from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import get_current_user
from database import get_db
from models import Chat, ChatMember, Message, User
from schemas import AddMembersRequest, ChatCreate, ChatOutWithLastMessage, GroupCreate, MessageOut, UserOut

router = APIRouter(tags=["chats"])


@router.get("/chats", response_model=list[ChatOutWithLastMessage])
async def list_chats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Find all chat IDs the current user belongs to
    my_chat_ids = select(ChatMember.chat_id).where(ChatMember.user_id == current_user.id)

    stmt = (
        select(Chat)
        .where(Chat.id.in_(my_chat_ids))
        .options(selectinload(Chat.members).selectinload(ChatMember.user))
    )
    result = await db.execute(stmt)
    chats = result.scalars().unique().all()

    out: list[ChatOutWithLastMessage] = []
    for chat in chats:
        # Last message
        msg_stmt = (
            select(Message)
            .where(Message.chat_id == chat.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        msg_result = await db.execute(msg_stmt)
        last_msg = msg_result.scalar_one_or_none()

        last_message = None
        if last_msg:
            sender = await db.get(User, last_msg.sender_id)
            last_message = MessageOut(
                id=last_msg.id,
                chat_id=last_msg.chat_id,
                sender_id=last_msg.sender_id,
                content=last_msg.content,
                type=last_msg.type,
                created_at=last_msg.created_at,
                sender_nickname=sender.nickname if sender else None,
            )

        members = [UserOut.model_validate(m.user) for m in chat.members]

        # For private chats, display the other user's nickname as chat name
        name = chat.name
        if chat.type == "private":
            other = [m for m in members if m.id != current_user.id]
            if other:
                name = other[0].nickname

        out.append(
            ChatOutWithLastMessage(
                id=chat.id,
                type=chat.type,
                name=name,
                avatar_url=chat.avatar_url,
                created_at=chat.created_at,
                last_message=last_message,
                members=members,
            )
        )

    return out


@router.post("/chats", response_model=ChatOutWithLastMessage)
async def create_private_chat(
    body: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot create chat with yourself")

    # Check target user exists
    target = await db.get(User, body.user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Idempotent: check if a private chat already exists between the two users
    stmt = (
        select(Chat)
        .where(Chat.type == "private")
        .where(
            Chat.id.in_(
                select(ChatMember.chat_id).where(ChatMember.user_id == current_user.id)
            )
        )
        .where(
            Chat.id.in_(
                select(ChatMember.chat_id).where(ChatMember.user_id == body.user_id)
            )
        )
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        # Reload with members
        stmt2 = (
            select(Chat)
            .where(Chat.id == existing.id)
            .options(selectinload(Chat.members).selectinload(ChatMember.user))
        )
        res2 = await db.execute(stmt2)
        chat = res2.scalar_one()
        members = [UserOut.model_validate(m.user) for m in chat.members]
        other = [m for m in members if m.id != current_user.id]
        return ChatOutWithLastMessage(
            id=chat.id,
            type=chat.type,
            name=other[0].nickname if other else None,
            avatar_url=chat.avatar_url,
            created_at=chat.created_at,
            last_message=None,
            members=members,
        )

    # Create new private chat
    chat = Chat(type="private")
    db.add(chat)
    await db.flush()

    db.add(ChatMember(chat_id=chat.id, user_id=current_user.id, role="member"))
    db.add(ChatMember(chat_id=chat.id, user_id=body.user_id, role="member"))
    await db.commit()

    # Reload with members
    stmt3 = (
        select(Chat)
        .where(Chat.id == chat.id)
        .options(selectinload(Chat.members).selectinload(ChatMember.user))
    )
    res3 = await db.execute(stmt3)
    chat = res3.scalar_one()
    members = [UserOut.model_validate(m.user) for m in chat.members]
    other = [m for m in members if m.id != current_user.id]
    return ChatOutWithLastMessage(
        id=chat.id,
        type=chat.type,
        name=other[0].nickname if other else None,
        avatar_url=chat.avatar_url,
        created_at=chat.created_at,
        last_message=None,
        members=members,
    )


@router.post("/chats/group", response_model=ChatOutWithLastMessage)
async def create_group(
    body: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a group chat. Creator becomes owner."""
    if not body.name or not body.name.strip():
        raise HTTPException(400, "Group name is required")
    if len(body.member_ids) < 1:
        raise HTTPException(400, "At least 1 other member required")

    # Verify all members exist
    for uid in body.member_ids:
        if not await db.get(User, uid):
            raise HTTPException(404, f"User {uid} not found")

    chat = Chat(type="group", name=body.name.strip())
    db.add(chat)
    await db.flush()

    # Add creator as owner
    db.add(ChatMember(chat_id=chat.id, user_id=current_user.id, role="owner"))
    # Add other members
    for uid in body.member_ids:
        if uid != current_user.id:
            db.add(ChatMember(chat_id=chat.id, user_id=uid, role="member"))

    # Add system message
    db.add(Message(chat_id=chat.id, sender_id=current_user.id,
                   content=f"{current_user.nickname} 创建了群聊", type="system"))
    await db.commit()

    # Reload with members
    stmt = select(Chat).where(Chat.id == chat.id).options(
        selectinload(Chat.members).selectinload(ChatMember.user)
    )
    result = await db.execute(stmt)
    chat = result.scalar_one()
    members = [UserOut.model_validate(m.user) for m in chat.members]

    return ChatOutWithLastMessage(
        id=chat.id, type=chat.type, name=chat.name,
        avatar_url=chat.avatar_url, created_at=chat.created_at,
        last_message=None, members=members,
    )


@router.get("/chats/{chat_id}/members")
async def get_chat_members(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify membership
    member = await db.execute(
        select(ChatMember).where(ChatMember.chat_id == chat_id, ChatMember.user_id == current_user.id)
    )
    if not member.scalar_one_or_none():
        raise HTTPException(403, "Not a member")

    result = await db.execute(
        select(ChatMember).where(ChatMember.chat_id == chat_id).options(selectinload(ChatMember.user))
    )
    members = result.scalars().all()
    return [{"user": UserOut.model_validate(m.user), "role": m.role} for m in members]


@router.post("/chats/{chat_id}/members")
async def add_members(
    chat_id: int,
    body: AddMembersRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify chat is a group
    chat = await db.get(Chat, chat_id)
    if not chat or chat.type != "group":
        raise HTTPException(400, "Can only add members to group chats")

    # Verify requester is member
    member = await db.execute(
        select(ChatMember).where(ChatMember.chat_id == chat_id, ChatMember.user_id == current_user.id)
    )
    if not member.scalar_one_or_none():
        raise HTTPException(403, "Not a member")

    added = []
    for uid in body.user_ids:
        user = await db.get(User, uid)
        if not user:
            continue
        # Check not already member
        existing = await db.execute(
            select(ChatMember).where(ChatMember.chat_id == chat_id, ChatMember.user_id == uid)
        )
        if existing.scalar_one_or_none():
            continue
        db.add(ChatMember(chat_id=chat_id, user_id=uid, role="member"))
        added.append(user)

    # System messages for each added user
    for user in added:
        db.add(Message(chat_id=chat_id, sender_id=current_user.id,
                       content=f"{user.nickname} 加入了群聊", type="system"))

    await db.commit()

    # Broadcast member_joined via WS
    from websocket.manager import manager
    for user in added:
        await manager.send_to_chat(chat_id, {
            "type": "member_joined", "chat_id": chat_id,
            "user": UserOut.model_validate(user).model_dump(mode="json"),
        })

    return {"added": len(added)}


@router.delete("/chats/{chat_id}/members/{user_id}")
async def remove_member(
    chat_id: int, user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chat = await db.get(Chat, chat_id)
    if not chat or chat.type != "group":
        raise HTTPException(400, "Can only remove from group chats")

    # Check requester is owner or admin
    requester_member = await db.execute(
        select(ChatMember).where(ChatMember.chat_id == chat_id, ChatMember.user_id == current_user.id)
    )
    req = requester_member.scalar_one_or_none()
    if not req or req.role not in ("owner", "admin"):
        raise HTTPException(403, "Only owner/admin can remove members")

    # Can't remove owner
    target_member_result = await db.execute(
        select(ChatMember).where(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id)
    )
    target = target_member_result.scalar_one_or_none()
    if not target:
        raise HTTPException(404, "User is not a member")
    if target.role == "owner":
        raise HTTPException(400, "Cannot remove the group owner")

    # Get user info for system message
    removed_user = await db.get(User, user_id)

    await db.delete(target)
    db.add(Message(chat_id=chat_id, sender_id=current_user.id,
                   content=f"{removed_user.nickname} 被移出了群聊", type="system"))
    await db.commit()

    # Broadcast
    from websocket.manager import manager
    await manager.send_to_chat(chat_id, {
        "type": "member_left", "chat_id": chat_id, "user_id": user_id,
    })

    return {"removed": True}
