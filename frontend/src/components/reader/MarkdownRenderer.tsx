import { useMemo } from 'preact/hooks';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked parser for GitHub Flavored Markdown and automatic line breaks
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Configure DOMPurify hook to make external links open safely in a new tab
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  const html = useMemo(() => {
    if (!content) return '';

    // Filter out residual game JSON fences or backtick artifacts
    let cleanContent = content.replace(/```(?:game-json|game_json|json)?\s*\{[\s\S]*?\([\s\S]*?```?/gi, '');
    cleanContent = cleanContent.replace(/```(?:game-json|game_json|json)?\s*$/gi, '').trim();

    // Parse Markdown to HTML
    const rawHtml = marked.parse(cleanContent) as string;

    // Sanitize HTML safely
    return DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['target', 'rel']
    });
  }, [content]);

  return (
    <div
      className="markdown-body prose prose-invert max-w-none 
        prose-headings:font-bold prose-headings:text-emerald-300 prose-headings:tracking-tight 
        prose-h1:text-2xl prose-h1:font-extrabold prose-h1:mt-6 prose-h1:mb-4
        prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-2
        prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-slate-200
        prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-white prose-strong:font-extrabold
        prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-950/40 prose-blockquote:py-2.5 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:text-slate-200 prose-blockquote:my-4 prose-blockquote:not-italic
        prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:p-4 prose-pre:my-4 prose-pre:overflow-x-auto
        prose-code:text-emerald-300 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4 prose-ul:space-y-1.5 prose-li:text-slate-300
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4 prose-ol:space-y-1.5
        prose-table:w-full prose-table:border-collapse prose-table:my-4
        prose-th:border prose-th:border-slate-800 prose-th:bg-slate-900 prose-th:p-2.5 prose-th:text-emerald-300
        prose-td:border prose-td:border-slate-800 prose-td:p-2.5 prose-td:text-slate-300
        prose-hr:border-slate-800 prose-hr:my-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
