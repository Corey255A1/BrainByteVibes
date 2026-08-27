from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from app.services.gemini_service import gemini_service
from app.services.markdown_store import markdown_store

router = APIRouter(prefix="/courses", tags=["courses"])

class CourseDagRequest(BaseModel):
    topic_prompt: str
    model: Optional[str] = "gemini-1.5-flash"

class CourseLessonRequest(BaseModel):
    course_title: str
    lesson_title: str
    lesson_description: str
    tags: List[str] = []
    read_minutes: int = 5
    model: Optional[str] = "gemini-1.5-flash"

class SaveLessonRequest(BaseModel):
    username: str
    folder_name: str
    lesson_id: str
    lesson_title: str
    content: str
    tags: List[str] = []
    read_minutes: int = 5
    course_title: str

@router.post("/generate-dag")
async def generate_course_dag(req: CourseDagRequest, x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key")):
    try:
        dag = await gemini_service.generate_course_dag(
            topic_prompt=req.topic_prompt,
            model=req.model,
            api_key=x_gemini_key
        )
        return dag
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream-lesson")
async def stream_course_lesson(req: CourseLessonRequest, x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key")):
    async def sse_generator():
        try:
            async for chunk in gemini_service.stream_course_lesson(
                course_title=req.course_title,
                lesson_title=req.lesson_title,
                lesson_description=req.lesson_description,
                tags=req.tags,
                read_minutes=req.read_minutes,
                model=req.model,
                api_key=x_gemini_key
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.post("/save-lesson")
async def save_course_lesson(req: SaveLessonRequest):
    try:
        frontmatter = {
            "title": req.lesson_title,
            "course_title": req.course_title,
            "lesson_id": req.lesson_id,
            "tags": req.tags,
            "read_minutes": req.read_minutes
        }
        rel_path = markdown_store.save_course_lesson(
            username=req.username,
            folder_name=req.folder_name,
            lesson_id=req.lesson_id,
            frontmatter=frontmatter,
            content=req.content,
            title=req.lesson_title
        )
        return {"status": "ok", "saved_path": rel_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
