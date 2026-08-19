import os
from pathlib import Path
import yaml
from app.core.config import settings

class MarkdownStore:
    def __init__(self, base_dir: str = None):
        self.base_dir = Path(base_dir or settings.ARTICLES_DIR)

    def get_user_dir(self, username: str) -> Path:
        user_dir = self.base_dir / username
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir

    def save_article(self, username: str, article_id: str, frontmatter: dict, content: str) -> str:
        user_dir = self.get_user_dir(username)
        filename = f"{article_id}.md"
        filepath = user_dir / filename

        fm_string = yaml.safe_dump(frontmatter, sort_keys=False)
        full_file_content = f"---\n{fm_string}---\n\n{content.strip()}\n"

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(full_file_content)

        return str(filepath.relative_to(self.base_dir))

    def read_article(self, username: str, article_id: str) -> tuple[dict, str]:
        user_dir = self.get_user_dir(username)
        filepath = user_dir / f"{article_id}.md"

        if not filepath.exists():
            raise FileNotFoundError(f"Article {article_id} not found for user {username}")

        with open(filepath, "r", encoding="utf-8") as f:
            raw_text = f.read()

        if raw_text.startswith("---"):
            parts = raw_text.split("---", 2)
            if len(parts) >= 3:
                frontmatter = yaml.safe_load(parts[1]) or {}
                content = parts[2].strip()
                return frontmatter, content

        return {}, raw_text

markdown_store = MarkdownStore()
