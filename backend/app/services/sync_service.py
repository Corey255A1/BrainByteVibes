import json
from datetime import datetime
from sqlmodel import Session, select
from app.models.user import User
from app.models.article import ArticleMeta
from app.models.reading_log import ReadingLog
from app.services.markdown_store import markdown_store

class SyncService:
    def push_mutations(self, session: Session, user_id: str, mutations: list[dict]) -> dict:
        processed_count = 0
        errors = []

        for item in mutations:
            action = item.get("action")
            payload = item.get("payload", {})

            try:
                if action == "push_article":
                    article_id = payload.get("id")
                    title = payload.get("title")
                    category = payload.get("category", "General")
                    tags = json.dumps(payload.get("tags", []))
                    read_time = payload.get("readTimeMinutes", 5)
                    markdown_content = payload.get("markdownContent", "")
                    frontmatter = payload.get("frontmatter", {})
                    game_type = payload.get("gameType")
                    game_completed = payload.get("gameCompleted", False)

                    # Save markdown file
                    rel_path = markdown_store.save_article(
                        username=user_id,
                        article_id=article_id,
                        frontmatter=frontmatter or {
                            "id": article_id,
                            "title": title,
                            "category": category,
                            "user": user_id
                        },
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
                    article_id = payload.get("articleId", "")
                    minutes_spent = payload.get("minutesSpent", 0)
                    game_completed = payload.get("gameCompleted", False)

                    log_entry = ReadingLog(
                        user_id=user_id,
                        article_id=article_id,
                        minutes_spent=minutes_spent,
                        game_completed=game_completed
                    )
                    session.add(log_entry)

                processed_count += 1
            except Exception as e:
                errors.append({"item": item, "error": str(e)})

        session.commit()
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
