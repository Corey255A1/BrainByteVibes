import { useState, useEffect } from 'preact/hooks';
import type { Profile, Article } from '../types';
import { db } from '../db/database';
import { Search, Calendar } from 'lucide-react';
import { formatDate } from '../utils/dates';

interface Props {
  profile: Profile;
  onSelectArticle: (articleId: string) => void;
}

export function LibraryPage({ profile, onSelectArticle }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    db.articles.where('profileId').equals(profile.id).toArray().then(setArticles);
  }, [profile.id]);

  const categories = Array.from(new Set(articles.map(a => a.category)));

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.markdownContent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    return matchesSearch && matchesCat;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24 flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-100 px-1">Your Knowledge Library</h1>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search articles or keywords..."
          value={searchQuery}
          onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-400"
        />
      </div>

      {/* Category Chips */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
            }`}
          >
            All ({articles.length})
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Article List */}
      <div className="flex flex-col gap-3 mt-2">
        {filteredArticles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
            No articles found in your library yet. Read articles from your feed to save them here!
          </div>
        ) : (
          filteredArticles.map(art => (
            <div
              key={art.id}
              onClick={() => onSelectArticle(art.id)}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/20">
                  {art.category}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Calendar size={10} /> {formatDate(art.createdAt)}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-1">{art.title}</h3>
              <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                <span>⏱️ {art.readTimeMinutes} min read</span>
                {art.gameCompleted && (
                  <span className="text-emerald-400 font-semibold">✓ Puzzle Completed</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
