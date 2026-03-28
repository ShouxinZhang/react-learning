from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from models import User
from schemas import UserOut
from auth import get_current_user
from database import get_db

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.get("/users/search", response_model=list[UserOut])
async def search_users(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pattern = f"%{q}%"
    stmt = (
        select(User)
        .where(
            User.id != current_user.id,
            or_(User.username.ilike(pattern), User.nickname.ilike(pattern)),
        )
        .limit(20)
    )
    result = await db.execute(stmt)
    return [UserOut.model_validate(u) for u in result.scalars().all()]
