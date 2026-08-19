from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/ai", tags=["ai"])

class TopicRequest(BaseModel):
    categories: list[str]
    read_history: Optional[list[str]] = None
    model: Optional[str] = "gemini-1.5-flash"

class ArticleRequest(BaseModel):
    topic: str
    category: str
    read_minutes: int = 5
    model: Optional[str] = "gemini-1.5-flash"

@router.get("/models")
async def list_models(x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key")):
    try:
        models = await gemini_service.list_models(api_key=x_gemini_key)
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/topics")
async def generate_topics(req: TopicRequest, x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key")):
    try:
        topics = await gemini_service.generate_topics(
            categories=req.categories,
            read_history=req.read_history,
            model=req.model,
            api_key=x_gemini_key
        )
        return {"topics": topics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/wildcard")
async def generate_wildcard(req: TopicRequest, x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key")):
    try:
        wildcard = await gemini_service.generate_wildcard(
            categories=req.categories,
            model=req.model,
            api_key=x_gemini_key
        )
        return wildcard
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/article")
async def generate_article_stream(req: ArticleRequest, x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key")):
    async def sse_generator():
        try:
            async for chunk in gemini_service.stream_article(
                topic=req.topic,
                category=req.category,
                read_minutes=req.read_minutes,
                model=req.model,
                api_key=x_gemini_key
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")
