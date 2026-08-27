from fastapi import APIRouter
from app.api.routes import ai, articles, sync, users, courses

api_router = APIRouter()
api_router.include_router(ai.router)
api_router.include_router(articles.router)
api_router.include_router(sync.router)
api_router.include_router(users.router)
api_router.include_router(courses.router)

