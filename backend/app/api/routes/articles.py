from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import Optional
from app.core.database import get_session
from app.models.article import ArticleMeta, ArticleMetaRead
from app.services.markdown_store import markdown_store

router = APIRouter(prefix="/articles", tags=["articles"])

@router.get("/{user_id}", response_model=list[ArticleMetaRead])
def list_articles(
    user_id: str,
    category: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    query = select(ArticleMeta).where(ArticleMeta.user_id == user_id)
    if category:
        query = query.where(ArticleMeta.category == category)
    query = query.order_by(ArticleMeta.created_at.desc())
    return session.exec(query).all()

@router.get("/{user_id}/{article_id}")
def get_article_detail(
    user_id: str,
    article_id: str,
    session: Session = Depends(get_session)
):
    meta = session.get(ArticleMeta, article_id)
    if not meta or meta.user_id != user_id:
        raise HTTPException(status_code=404, detail="Article metadata not found")

    try:
        frontmatter, content = markdown_store.read_article(user_id, article_id)
        return {
            "meta": meta,
            "frontmatter": frontmatter,
            "content": content
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
