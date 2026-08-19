import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AntiScroll Backend"
    API_V1_STR: str = "/api"
    GEMINI_API_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./antiscroll.db"
    ARTICLES_DIR: str = "./data/articles"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:8000", "*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
