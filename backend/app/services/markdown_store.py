import os
import re
from pathlib import Path
import yaml
from app.core.config import settings

def format_title_filename(title: str, article_id: str) -> str:
    if not title:
        return f"{article_id}.md"

    # Split title into words, remove non-alphanumeric chars per word, join with no spaces
    words = title.split()
    clean_words = [re.sub(r'[^\w]', '', w) for w in words]
    clean_title = "".join(clean_words)

    if not clean_title:
        return f"{article_id}.md"

    return f"{clean_title}.md"

class MarkdownStore:
    def __init__(self, base_dir: str = None):
        self.base_dir = Path(base_dir or settings.ARTICLES_DIR)

    def get_user_dir(self, username: str) -> Path:
        # Sanitize username directory (e.g., "Corey" -> "corey")
        safe_username = re.sub(r'[^\w\s-]', '', username or "user").strip().lower() or "user"
        user_dir = self.base_dir / safe_username
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir

    def save_article(self, username: str, article_id: str, frontmatter: dict, content: str, title: str = None) -> str:
        user_dir = self.get_user_dir(username)
        article_title = title or frontmatter.get("title") or ""
        filename = format_title_filename(article_title, article_id)
        filepath = user_dir / filename

        fm_string = yaml.safe_dump(frontmatter, sort_keys=False)
        full_file_content = f"---\n{fm_string}---\n\n{content.strip()}\n"

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(full_file_content)

        return str(filepath.relative_to(self.base_dir))

    def read_article(self, username: str, article_id: str, file_path: str = None) -> tuple[dict, str]:
        if file_path:
            filepath = self.base_dir / file_path
        else:
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

    def save_course_lesson(self, username: str, folder_name: str, lesson_id: str, frontmatter: dict, content: str, title: str = None) -> str:
        user_dir = self.get_user_dir(username)
        # Create courses/{folder_name} directory under user directory
        course_dir = user_dir / "courses" / folder_name
        course_dir.mkdir(parents=True, exist_ok=True)

        lesson_title = title or frontmatter.get("title") or ""
        filename = format_title_filename(lesson_title, lesson_id)
        filepath = course_dir / filename

        fm_string = yaml.safe_dump(frontmatter, sort_keys=False)
        full_file_content = f"---\n{fm_string}---\n\n{content.strip()}\n"

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(full_file_content)

        return str(filepath.relative_to(self.base_dir))

markdown_store = MarkdownStore()

