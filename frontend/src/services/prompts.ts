export function buildTopicPrompt(categories: string[], readHistory: string[] = []): string {
  const cats = categories.length > 0 ? categories.join(', ') : 'General Knowledge, Technology, Science';
  const history = readHistory.length > 0 ? readHistory.slice(-10).join(', ') : 'None';

  return `You are a micro-learning topic curator for BrainByte.
User preferred categories: ${cats}
Recently read topics: ${history}

Generate exactly 5 distinct, highly intriguing micro-learning topic cards strictly tailored to the user's preferred categories (${cats}).
Requirements:
1. Focus on surprising, non-obvious, or deep-dive aspects of the target categories.
2. Short catchy title (max 6 words).
3. Subtitle hook (1 punchy sentence).

Output strictly valid JSON with this format:
[
  { "title": "Topic Title", "subtitle": "Intriguing hook sentence.", "category": "Selected Category" }
]`;
}

export function buildWildcardPrompt(categories: string[]): string {
  const cats = categories.length > 0 ? categories.join(', ') : 'standard categories';
  return `Generate 1 wildcard/serendipitous micro-learning topic strictly OUTSIDE these categories: ${cats}.
Topic must be multidisciplinary, strange, or fascinating (e.g. bioluminescence, ancient cryptography, fluid dynamics, music acoustics).

Output strictly valid JSON:
{ "title": "Wildcard Topic", "subtitle": "A fascinating hook.", "category": "Wildcard" }`;
}

export function buildArticlePrompt(topic: string, category: string, readMinutes: number = 5): string {
  const wordCount = readMinutes * 200;
  return `Write a bite-sized micro-learning article titled: "${topic}" in category: "${category}".
Target read length: ${readMinutes} minutes (~${wordCount} words).

Structure requirements:
1. Catchy title and short intro hook explaining why this subject is fascinating.
2. Clear markdown ## headings structuring the topic.
3. Use > callout boxes for key takeaways or surprising facts.
4. STRICT CATEGORY ALIGNMENT: Focus strictly on the subject matter of "${category}". If and ONLY IF the category is explicitly a software programming or computer science topic (e.g. C++, Python, Web Dev, DevOps), include code snippets. DO NOT output code snippets or Python scripts for biology, oceanography, science, history, music, or general topics unless explicitly requested.
5. End with a "## Sources" section listing 2-3 real, authoritative references (websites, research papers, books, or documentation). EVERY source entry MUST include a clickable markdown link with a valid, real HTTPS URL (e.g., - [NOAA Ocean Exploration](https://oceanexplorer.noaa.gov/) or - [Wikipedia: Mariana Trench](https://en.wikipedia.org/wiki/Mariana_Trench)).

At the very end of the article, output a mini-game JSON inside a \`\`\`game-json ... \`\`\` code fence testing the article content.
Pick ONE game type out of: "wordle", "flashcard", "concept_match", "crossword", or "word_search".

Schema options:

1. Wordle:
\`\`\`game-json
{
  "type": "wordle",
  "data": { "targetWord": "OCEAN", "hint": "Vast body of saltwater", "maxAttempts": 6 }
}
\`\`\`

2. Flashcard:
\`\`\`game-json
{
  "type": "flashcard",
  "data": { "cards": [ { "front": "What is the deepest ocean trench?", "back": "Mariana Trench" } ] }
}
\`\`\`

3. Concept Match:
\`\`\`game-json
{
  "type": "concept_match",
  "data": { "pairs": [ { "term": "Bioluminescence", "definition": "Light produced by living organisms" } ] }
}
\`\`\`

4. Crossword:
\`\`\`game-json
{
  "type": "crossword",
  "data": {
    "gridSize": { "rows": 5, "cols": 5 },
    "clues": [
      { "number": 1, "direction": "across", "clue": "Deepest trench", "answer": "MARIANA", "startRow": 0, "startCol": 0 }
    ]
  }
}
\`\`\`

5. Word Search:
\`\`\`game-json
{
  "type": "word_search",
  "data": {
    "gridSize": 6,
    "grid": [["O","C","E","A","N","X"],["A","B","C","D","E","F"],["G","H","I","J","K","L"],["M","N","O","P","Q","R"],["S","T","U","V","W","X"],["Y","Z","A","B","C","D"]],
    "words": [ { "word": "OCEAN", "hint": "Vast body of saltwater" } ]
  }
}
\`\`\`
`;
}

export function buildCourseDagPrompt(topicPrompt: string): string {
  return `You are a master curriculum architect and subject matter expert for BrainByte.
The user wants to master the following topic: "${topicPrompt}".

Design a structured, progressive learning curriculum represented as a Knowledge Graph / Directed Acyclic Graph (DAG).
Break down the subject into 5 to 7 logical bite-sized lesson nodes ordered from foundational concepts to advanced applications.

Requirements:
1. "course_title": Clean, catchy title for the entire course (max 6 words).
2. "nodes": List of lesson nodes. Each node must have:
   - "id": unique string identifier (e.g. "node-1", "node-2")
   - "title": concise lesson title (e.g. "Foundations of Superposition")
   - "description": 1-2 sentence hook describing what the user will master in this lesson.
   - "prerequisites": list of prerequisite node IDs that MUST be completed before unlocking this node. The foundational node(s) must have an empty list [].
   - "tags": list of 2-4 key concept/topic tags covered in this lesson.

Output strictly valid JSON with this exact schema:
{
  "course_title": "Course Title Here",
  "nodes": [
    {
      "id": "node-1",
      "title": "Foundational Concept",
      "description": "Introduction to key principles.",
      "prerequisites": [],
      "tags": ["basics", "principles"]
    },
    {
      "id": "node-2",
      "title": "Intermediate Topic",
      "description": "Building upon foundational concepts.",
      "prerequisites": ["node-1"],
      "tags": ["intermediate", "application"]
    }
  ]
}`;
}

export function buildCourseLessonPrompt(
  courseTitle: string,
  lessonTitle: string,
  lessonDescription: string,
  tags: string[],
  readMinutes: number = 5
): string {
  const wordCount = readMinutes * 200;
  const tagsStr = tags.length > 0 ? tags.join(', ') : 'General';

  return `Write a bite-sized micro-learning lesson for the course "${courseTitle}".
Lesson Title: "${lessonTitle}"
Lesson Focus: ${lessonDescription}
Key Topic Tags Covered: ${tagsStr}

AVAILABLE USER READING TIME: ${readMinutes} MINUTES (~${wordCount} words target).

IMPORTANT TIME-TAILORING RULES:
1. If reading time is short (3-5 minutes): Make the article punchy, crystal clear, focused on 1 core mental model, and include 1 interactive check/quiz at the end.
2. If reading time is medium to long (10-30 minutes): Provide a comprehensive deep dive with rich examples, detailed step-by-step breakdowns, code/diagrams if relevant, and 2-3 knowledge checks/quizzes.

Structure requirements:
1. Catchy title and short intro hook explaining the objective.
2. Clear markdown ## headings.
3. Use > callout boxes for key formulas, rules, or takeaways.
4. Tag Summary Callout box at top highlighting covered topics: Tags: [${tagsStr}]
5. End with a "## Sources" section listing 2-3 real, authoritative references with valid HTTPS links.

At the very end of the lesson, output a mini-game JSON inside a \`\`\`game-json ... \`\`\` code fence testing the lesson content.
Pick ONE game type out of: "wordle", "flashcard", "concept_match", "crossword", or "word_search".

Schema example:
\`\`\`game-json
{
  "type": "concept_match",
  "data": { "pairs": [ { "term": "Term A", "definition": "Definition A" } ] }
}
\`\`\`
`;
}

