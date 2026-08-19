from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class UserBase(SQLModel):
    name: str
    avatar_emoji: str = "🧑‍💻"
    categories: str = "[]"  # JSON list string
    read_length_minutes: int = 5
    preferred_model: Optional[str] = "gemini-1.5-flash"

class User(UserBase, table=True):
    id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(UserBase):
    id: str

class UserRead(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
