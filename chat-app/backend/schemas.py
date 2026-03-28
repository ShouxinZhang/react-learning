from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ── Auth ──
class UserCreate(BaseModel):
    username: str
    password: str
    nickname: str


class UserOut(BaseModel):
    id: int
    username: str
    nickname: str
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    user: UserOut
    token: str


# ── Chat ──
class ChatOut(BaseModel):
    id: int
    type: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageOut(BaseModel):
    id: int
    chat_id: int
    sender_id: int
    content: str
    type: str
    created_at: datetime
    sender_nickname: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ChatOutWithLastMessage(BaseModel):
    id: int
    type: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    last_message: Optional[MessageOut] = None
    members: list[UserOut] = []

    model_config = ConfigDict(from_attributes=True)


class ChatCreate(BaseModel):
    user_id: int


class GroupCreate(BaseModel):
    name: str
    member_ids: list[int]


class AddMembersRequest(BaseModel):
    user_ids: list[int]


# ── Message ──


class MessageCreate(BaseModel):
    chat_id: int
    content: str
    type: str = "text"
