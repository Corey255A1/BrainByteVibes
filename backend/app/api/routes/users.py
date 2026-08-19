from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.user import User, UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=list[UserRead])
def list_users(session: Session = Depends(get_session)):
    return session.exec(select(User)).all()

@router.post("", response_model=UserRead)
def create_or_update_user(user_in: UserCreate, session: Session = Depends(get_session)):
    user = session.get(User, user_in.id)
    if user:
        user.name = user_in.name
        user.avatar_emoji = user_in.avatar_emoji
        user.categories = user_in.categories
        user.read_length_minutes = user_in.read_length_minutes
        user.updated_at = datetime.utcnow()
    else:
        user = User.model_validate(user_in)
        session.add(user)
    session.commit()
    session.refresh(user)
    return user
