from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field

class ReadingLogBase(SQLModel):
    user_id: str = Field(index=True)
    article_id: str = Field(index=True)
    log_date: date = Field(default_factory=date.today)
    minutes_spent: int = 0
    game_completed: bool = False

class ReadingLog(ReadingLogBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReadingLogCreate(ReadingLogBase):
    pass

class ReadingLogRead(ReadingLogBase):
    id: int
    created_at: datetime
