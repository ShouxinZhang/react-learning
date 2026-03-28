"""Super admin routes — LOCAL DEV ONLY, never deploy to production."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from database import get_db
from models import User

router = APIRouter(tags=["admin"])


@router.get("/admin/users")
async def list_all_users(db: AsyncSession = Depends(get_db)):
    """List all users with plaintext passwords (super admin)."""
    result = await db.execute(select(User).order_by(User.id))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "nickname": u.nickname,
            "password_plain": u.password_plain or "(hash-only, 注册时未记录)",
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.post("/admin/reset-password")
async def reset_password(username: str, new_password: str, db: AsyncSession = Depends(get_db)):
    """Reset a user's password (super admin)."""
    from auth import hash_password
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        return {"error": "User not found"}
    user.password_hash = hash_password(new_password)
    user.password_plain = new_password
    await db.commit()
    return {"ok": True, "username": username}
