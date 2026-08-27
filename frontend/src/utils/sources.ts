import type { SourceLink } from '../types';

export function extractSourcesFromMarkdown(markdown: string, lessonTitle?: string): SourceLink[] {
  const sources: SourceLink[] = [];
  if (!markdown) return sources;

  // Search specifically in the ## Sources section or anywhere in markdown for links
  const sourcesSectionMatch = markdown.match(/##\s*Sources[\s\S]*/i);
  const searchArea = sourcesSectionMatch ? sourcesSectionMatch[0] : markdown;

  // Match markdown links: [Title](https://...)
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(searchArea)) !== null) {
    const title = match[1].trim();
    const url = match[2].trim();
    if (title && url && !sources.some(s => s.url === url)) {
      sources.push({ title, url, lessonTitle });
    }
  }

  return sources;
}
