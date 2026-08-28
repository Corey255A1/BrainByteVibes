from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.user import User, UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])

from app.services.markdown_store import markdown_store

@router.get("", response_model=list[UserRead])
def list_users(session: Session = Depends(get_session)):
    return session.exec(select(User)).all()


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: str, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", response_model=UserRead)
def create_or_update_user(user_in: UserCreate, session: Session = Depends(get_session)):
    user = session.get(User, user_in.id)
    if user:
        user.name = user_in.name
        user.avatar_emoji = user_in.avatar_emoji
        user.categories = user_in.categories
        user.read_length_minutes = user_in.read_length_minutes
        user.preferred_model = user_in.preferred_model
        user.preferred_topic_model = user_in.preferred_topic_model
        user.feed_layout_mode = user_in.feed_layout_mode
        user.updated_at = datetime.utcnow()
    else:
        user = User.model_validate(user_in)
        session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: str, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"status": "ok", "message": f"User {user_id} deleted from database"}


