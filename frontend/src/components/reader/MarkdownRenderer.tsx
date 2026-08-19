import { useMemo } from 'preact/hooks';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  const html = useMemo(() => {
    if (!content) return '';
    const rawHtml = marked.parse(content) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [content]);

  return (
    <div
      className="prose prose-invert max-w-none prose-headings:text-emerald-300 prose-a:text-sky-400 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-950/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 text-slate-200 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
