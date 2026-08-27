from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

# Create SQLite engine with connect_args check_same_thread=False for multi-threading in FastAPI
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)

from sqlalchemy import text

def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE user ADD COLUMN preferred_topic_model VARCHAR DEFAULT 'gemini-1.5-flash-8b'"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE user ADD COLUMN feed_layout_mode VARCHAR DEFAULT 'swipe'"))
            conn.commit()
        except Exception:
            pass


def get_session():
    with Session(engine) as session:
        yield session
