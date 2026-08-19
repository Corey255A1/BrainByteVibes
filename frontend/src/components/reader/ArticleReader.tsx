import { useState } from 'preact/hooks';
import type { Article } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { GameRunner } from '../games/GameRunner';
import { ArrowLeft, CheckCircle, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  article: Article;
  onBack: () => void;
  onGameComplete: (articleId: string) => void;
}

export function ArticleReader({ article, onBack, onGameComplete }: Props) {
  const [copied, setCopied] = useState(false);
  const [gameDone, setGameDone] = useState(article.gameCompleted);

  const handleGameComplete = () => {
    setGameDone(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    onGameComplete(article.id);
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText(article.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 pt-4">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-all"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <button
          onClick={copyMarkdown}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all"
        >
          {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
        </button>
      </div>

      {/* Article Meta Banner */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
            {article.category}
          </span>
          <span className="text-xs text-slate-400">⏱️ {article.readTimeMinutes} min read</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          {article.title}
        </h1>
      </div>

      {/* Main Markdown Content */}
      <MarkdownRenderer content={article.markdownContent} />

      {/* Mini-Game Section */}
      {article.gamePayload && (
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              🎯 Article Knowledge Drill
            </h3>
            {gameDone && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <CheckCircle size={14} /> Completed (+XP)
              </span>
            )}
          </div>
          <GameRunner payload={article.gamePayload} onComplete={handleGameComplete} />
        </div>
      )}
    </div>
  );
}
