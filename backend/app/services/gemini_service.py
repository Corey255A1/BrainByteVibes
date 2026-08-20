import json
import os
from typing import AsyncGenerator
from google import genai
from google.genai import types
from app.core.config import settings

# Fallback models list with cost/tier annotations
FALLBACK_MODELS = [
    {
        "id": "gemini-1.5-flash-8b",
        "name": "Gemini 1.5 Flash 8B",
        "costTier": "💲",
        "costDescription": "Cheapest / Ultra Fast",
        "description": "Fastest and lowest cost model for high volume tasks."
    },
    {
        "id": "gemini-1.5-flash",
        "name": "Gemini 1.5 Flash",
        "costTier": "💲💲",
        "costDescription": "Balanced / Low Cost",
        "description": "Recommended default. Fast, accurate, and budget friendly."
    },
    {
        "id": "gemini-1.5-pro",
        "name": "Gemini 1.5 Pro",
        "costTier": "💲💲💲",
        "costDescription": "Higher Cost / Complex Reasoning",
        "description": "Advanced reasoning and deep context analysis."
    }
]

def determine_cost_tier(model_id: str) -> tuple[str, str]:
    mid = model_id.lower()
    if "8b" in mid or "nano" in mid or "lite" in mid:
        return "💲", "Cheapest / Ultra Fast"
    elif "flash" in mid:
        return "💲💲", "Balanced / Low Cost"
    elif "pro" in mid or "ultra" in mid:
        return "💲💲💲", "Higher Cost / High Performance"
    return "💲💲", "Standard"

class GeminiService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def _get_client(self, api_key_override: str = None) -> genai.Client:
        key = api_key_override or self.api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise ValueError("Gemini API key is not configured. Provide it in settings or request header.")
        return genai.Client(api_key=key)

    async def list_models(self, api_key: str = None) -> list[dict]:
        try:
            client = self._get_client(api_key)
            remote_models = client.models.list()
            result = []
            for m in remote_models:
                name = m.name or ""
                # Strip models/ prefix if present
                model_id = name.replace("models/", "")
                # Only include generateContent supporting models
                if "gemini" in model_id:
                    tier, desc = determine_cost_tier(model_id)
                    result.append({
                        "id": model_id,
                        "name": getattr(m, "display_name", model_id) or model_id,
                        "costTier": tier,
                        "costDescription": desc,
                        "description": getattr(m, "description", "") or ""
                    })
            if result:
                # Sort models by cost tier and id
                result.sort(key=lambda x: (x["costTier"], x["id"]))
                return result
        except Exception as e:
            print(f"Warning: Failed to list models from Gemini API: {e}")

        return FALLBACK_MODELS

    async def generate_topics(self, categories: list[str], read_history: list[str] = None, model: str = "gemini-1.5-flash", api_key: str = None) -> list[dict]:
        client = self._get_client(api_key)
        target_model = model or "gemini-1.5-flash"
        cats_str = ", ".join(categories) if categories else "General Knowledge, Technology, Science"
        history_str = ", ".join(read_history[-10:]) if read_history else "None"

        prompt = f"""You are a micro-learning topic curator for BrainByte.
User preferred categories: {cats_str}
Recently read topics: {history_str}

Generate exactly 5 distinct, highly intriguing micro-learning topic cards strictly tailored to the user's preferred categories ({cats_str}).
Requirements:
1. Surprising, focused, or non-obvious aspect of one of the target categories.
2. Short catchy title (max 6 words).
3. Subtitle hook (1 punchy sentence).

Output strictly valid JSON with this format:
[
  {{"title": "Topic 1", "subtitle": "Hook 1", "category": "Category A"}},
  ...
]
"""
        response = client.models.generate_content(
            model=target_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)

    async def generate_wildcard(self, categories: list[str], model: str = "gemini-1.5-flash", api_key: str = None) -> dict:
        client = self._get_client(api_key)
        target_model = model or "gemini-1.5-flash"
        cats_str = ", ".join(categories) if categories else "standard categories"

        prompt = f"""Generate 1 wildcard/serendipitous micro-learning topic strictly OUTSIDE these categories: {cats_str}.
Topic must be multidisciplinary, strange, or fascinating (e.g. bioluminescence, ocean topography, linguistics, ancient cryptography).

Output strictly valid JSON:
{{"title": "Topic", "subtitle": "Hook sentence", "category": "Wildcard"}}
"""
        response = client.models.generate_content(
            model=target_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)

    async def stream_article(self, topic: str, category: str, read_minutes: int = 5, model: str = "gemini-1.5-flash", api_key: str = None) -> AsyncGenerator[str, None]:
        client = self._get_client(api_key)
        target_model = model or "gemini-1.5-flash"
        word_count = read_minutes * 200

        prompt = f"""Write a bite-sized micro-learning article titled: "{topic}" in category: "{category}".
Target read length: {read_minutes} minutes (~{word_count} words).

Structure:
1. Engaging title and short introduction
2. Clear markdown ## headings
3. Use > callout boxes for key takeaways
4. STRICT CATEGORY ALIGNMENT: Focus strictly on the subject matter of "{category}". Include code snippets ONLY IF the category is explicitly software engineering or computer programming. DO NOT output code snippets or Python scripts for biology, oceanography, science, history, music, or general topics.
5. End with a "## Sources" section listing 2-3 real references

At the very end of the article, output a mini-game JSON inside a ```game-json ... ``` code fence testing the article content.
Pick ONE game type out of: "wordle", "flashcard", "concept_match", "crossword", or "word_search".

Examples of game schemas:
Wordle:
```game-json
{{
  "type": "wordle",
  "data": {{ "targetWord": "OCEAN", "hint": "Vast body of saltwater", "maxAttempts": 6 }}
}}
```
Flashcard:
```game-json
{{
  "type": "flashcard",
  "data": {{ "cards": [ {{"front": "Deepest trench?", "back": "Mariana Trench"}} ] }}
}}
```
Concept Match:
```game-json
{{
  "type": "concept_match",
  "data": {{ "pairs": [ {{"term": "Bioluminescence", "definition": "Light from living organisms"}} ] }}
}}
```
Crossword:
```game-json
{{
  "type": "crossword",
  "data": {{
    "gridSize": {{ "rows": 5, "cols": 5 }},
    "clues": [
      {{ "number": 1, "direction": "across", "clue": "Deepest ocean trench", "answer": "MARIANA", "startRow": 0, "startCol": 0 }}
    ]
  }}
}}
```
Word Search:
```game-json
{{
  "type": "word_search",
  "data": {{
    "gridSize": 6,
    "grid": [["O","C","E","A","N","X"],["A","B","C","D","E","F"],["G","H","I","J","K","L"],["M","N","O","P","Q","R"],["S","T","U","V","W","X"],["Y","Z","A","B","C","D"]],
    "words": [ {{ "word": "OCEAN", "hint": "Vast body of saltwater" }} ]
  }}
}}
```
"""
        response_stream = client.models.generate_content_stream(
            model=target_model,
            contents=prompt,
        )
        for chunk in response_stream:
            if chunk.text:
                yield chunk.text

gemini_service = GeminiService()
