from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.core.database import init_db
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes under /api
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}

# Serve single-container static PWA frontend if built static files exist
static_path = Path(settings.STATIC_DIR)
if static_path.exists() and (static_path / "index.html").exists():
    if (static_path / "assets").exists():
        app.mount("/assets", StaticFiles(directory=static_path / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow /api and /health routes to bypass static serving
        if full_path.startswith("api") or full_path == "health":
            return {"detail": "Not found"}

        # Serve static file if it exists (sw.js, manifest.webmanifest, favicon.svg, etc.)
        file_path = static_path / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)

        # Fallback to index.html for client-side SPA routing
        return FileResponse(static_path / "index.html")
