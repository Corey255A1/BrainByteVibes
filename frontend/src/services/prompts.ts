export function buildTopicPrompt(categories: string[], readHistory: string[] = []): string {
  const cats = categories.length > 0 ? categories.join(', ') : 'General Knowledge, Technology, Science';
  const history = readHistory.length > 0 ? readHistory.slice(-10).join(', ') : 'None';

  return `You are a micro-learning topic curator for AntiScroll.
User preferred categories: ${cats}
Recently read topics: ${history}

Generate exactly 5 distinct, highly intriguing micro-learning topic cards.
Requirements:
1. Surprising, focused, or non-obvious aspect of one of the target categories.
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
1. Catchy title and short intro hook
2. Clear markdown ## headings
3. Use > callout boxes for key takeaways
4. Include concrete code snippets or examples if technical
5. End with a "## Sources" section listing 2-3 real references

At the very end of the article, output a mini-game JSON inside a \`\`\`game-json ... \`\`\` code fence testing the article content.
Pick ONE game type out of: "wordle", "flashcard", "concept_match", "crossword", or "word_search".

Schema options:

1. Wordle:
\`\`\`game-json
{
  "type": "wordle",
  "data": { "targetWord": "RAFT", "hint": "Consensus algorithm term", "maxAttempts": 6 }
}
\`\`\`

2. Flashcard:
\`\`\`game-json
{
  "type": "flashcard",
  "data": { "cards": [ { "front": "Question", "back": "Answer" } ] }
}
\`\`\`

3. Concept Match:
\`\`\`game-json
{
  "type": "concept_match",
  "data": { "pairs": [ { "term": "Term", "definition": "Definition" } ] }
}
\`\`\`

4. Crossword:
\`\`\`game-json
{
  "type": "crossword",
  "data": {
    "gridSize": { "rows": 5, "cols": 5 },
    "clues": [
      { "number": 1, "direction": "across", "clue": "Consensus algorithm", "answer": "RAFT", "startRow": 0, "startCol": 0 }
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
    "grid": [["R","A","F","T","X","Y"],["A","B","C","D","E","F"],["G","H","I","J","K","L"],["M","N","O","P","Q","R"],["S","T","U","V","W","X"],["Y","Z","A","B","C","D"]],
    "words": [ { "word": "RAFT", "hint": "Consensus algorithm" } ]
  }
}
\`\`\`
`;
}
