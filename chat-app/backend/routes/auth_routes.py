from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User
from schemas import UserCreate, LoginRequest, AuthResponse, UserOut
from auth import hash_password, verify_password, create_token
import re

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Validate username: 3-20 chars, alphanumeric + underscore
    if not re.match(r'^[a-zA-Z0-9_]{3,20}$', data.username):
        raise HTTPException(400, "Username must be 3-20 alphanumeric/underscore characters")
    if len(data.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    # Check duplicate
    existing = await db.execute(select(User).where(User.username == data.username))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Username already exists")

    user = User(
        username=data.username,
        nickname=data.nickname,
        password_hash=hash_password(data.password),
        password_plain=data.password,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id)
    return AuthResponse(user=UserOut.model_validate(user), token=token)


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid username or password")

    token = create_token(user.id)
    return AuthResponse(user=UserOut.model_validate(user), token=token)
