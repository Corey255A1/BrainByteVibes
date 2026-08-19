from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class ArticleMetaBase(SQLModel):
    user_id: str = Field(index=True)
    topic_card_id: Optional[str] = None
    title: str
    category: str
    tags: str = "[]"  # JSON array string
    read_time_minutes: int = 5
    game_type: Optional[str] = None
    game_completed: bool = False
    read_at: Optional[datetime] = None

class ArticleMeta(ArticleMetaBase, table=True):
    id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    file_path: str

class ArticleMetaCreate(ArticleMetaBase):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ArticleMetaRead(ArticleMetaBase):
    id: str
    created_at: datetime
    file_path: str
