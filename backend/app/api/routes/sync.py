from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlmodel import Session
from app.core.database import get_session
from app.services.sync_service import sync_service

router = APIRouter(prefix="/sync", tags=["sync"])

class PushPayload(BaseModel):
    user_id: str
    mutations: list[dict]

@router.post("/push")
def push_sync(payload: PushPayload, session: Session = Depends(get_session)):
    try:
        result = sync_service.push_mutations(session, payload.user_id, payload.mutations)
        return {"status": "ok", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pull/{user_id}")
def pull_sync(
    user_id: str,
    since: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    since_dt = None
    if since:
        try:
            since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
        except ValueError:
            pass

    return sync_service.pull_updates(session, user_id, since=since_dt)
