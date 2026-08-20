import json
import logging
from datetime import datetime, date
from sqlmodel import Session, select
from app.models.user import User
from app.models.article import ArticleMeta
from app.models.reading_log import ReadingLog
from app.services.markdown_store import markdown_store

logger = logging.getLogger("uvicorn.error")

class SyncService:
    def _ensure_user(self, session: Session, user_id: str) -> None:
        try:
            user = session.get(User, user_id)
            if not user:
                new_user = User(
                    id=user_id,
                    name=user_id,
                    avatar_emoji="🧑‍💻",
                    categories="[]",
                    read_length_minutes=5,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(new_user)
                session.commit()
        except Exception as e:
            session.rollback()
            logger.warn(f"Failed to auto-create user record for {user_id}: {e}")

    def push_mutations(self, session: Session, user_id: str, mutations: list[dict]) -> dict:
        self._ensure_user(session, user_id)
        processed_count = 0
        errors = []

        for item in mutations:
            action = item.get("action")
            payload = item.get("payload", {}) or {}

            try:
                if action == "push_article":
                    article_id = payload.get("id")
                    if not article_id:
                        continue

                    title = payload.get("title", "Untitled Article")
                    category = payload.get("category", "General")
                    tags_raw = payload.get("tags", [])
                    tags = json.dumps(tags_raw) if isinstance(tags_raw, list) else str(tags_raw or "[]")
                    read_time = int(payload.get("readTimeMinutes", 5) or 5)
                    markdown_content = payload.get("markdownContent", "")
                    frontmatter = payload.get("frontmatter") or {
                        "id": article_id,
                        "title": title,
                        "category": category,
                        "user": user_id
                    }
                    game_type = payload.get("gameType")
                    game_completed = bool(payload.get("gameCompleted", False))

                    # Save markdown file
                    rel_path = markdown_store.save_article(
                        username=user_id,
                        article_id=article_id,
                        frontmatter=frontmatter,
                        content=markdown_content
                    )

                    # Upsert DB metadata record
                    existing = session.get(ArticleMeta, article_id)
                    if existing:
                        existing.title = title
                        existing.category = category
                        existing.tags = tags
                        existing.game_completed = game_completed
                    else:
                        article_meta = ArticleMeta(
                            id=article_id,
                            user_id=user_id,
                            title=title,
                            category=category,
                            tags=tags,
                            read_time_minutes=read_time,
                            game_type=game_type,
                            game_completed=game_completed,
                            file_path=rel_path
                        )
                        session.add(article_meta)

                elif action == "push_stats" or action == "log_reading":
                    article_id = payload.get("articleId") or payload.get("article_id") or ""
                    minutes_spent = int(payload.get("minutesSpent", 0) or 0)
                    game_completed = bool(payload.get("gameCompleted", False))

                    log_entry = ReadingLog(
                        user_id=user_id,
                        article_id=article_id,
                        log_date=date.today(),
                        minutes_spent=minutes_spent,
                        game_completed=game_completed
                    )
                    session.add(log_entry)

                processed_count += 1
            except Exception as e:
                logger.error(f"Error processing mutation item {item}: {e}")
                errors.append({"item": item, "error": str(e)})

        try:
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Error committing push mutations for user {user_id}: {e}")
            errors.append({"action": "commit", "error": str(e)})

        return {"processed": processed_count, "errors": errors}

    def pull_updates(self, session: Session, user_id: str, since: datetime = None) -> dict:
        query = select(ArticleMeta).where(ArticleMeta.user_id == user_id)
        if since:
            query = query.where(ArticleMeta.created_at >= since)

        articles_meta = session.exec(query).all()
        result_articles = []

        for meta in articles_meta:
            try:
                fm, content = markdown_store.read_article(user_id, meta.id)
                result_articles.append({
                    "id": meta.id,
                    "title": meta.title,
                    "category": meta.category,
                    "tags": json.loads(meta.tags) if meta.tags else [],
                    "readTimeMinutes": meta.read_time_minutes,
                    "markdownContent": content,
                    "frontmatter": fm,
                    "gameType": meta.game_type,
                    "gameCompleted": meta.game_completed,
                    "createdAt": meta.created_at.isoformat()
                })
            except Exception:
                continue

        return {"articles": result_articles, "timestamp": datetime.utcnow().isoformat()}

sync_service = SyncService()
