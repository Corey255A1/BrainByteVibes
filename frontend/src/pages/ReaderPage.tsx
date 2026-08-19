import { useState, useEffect } from 'preact/hooks';
import type { Profile, TopicCard, Article } from '../types';
import { db } from '../db/database';
import { geminiService } from '../services/gemini';
import { syncManager } from '../services/sync';
import { ArticleReader } from '../components/reader/ArticleReader';
import { evaluateBadges } from '../utils/badges';
import { RefreshCw } from 'lucide-react';

interface Props {
  profile: Profile;
  topicCard: TopicCard | null;
  articleId?: string | null;
  onBack: () => void;
}

export function ReaderPage({ profile, topicCard, articleId, onBack }: Props) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  useEffect(() => {
    if (articleId) {
      db.articles.get(articleId).then(art => {
        if (art) setArticle(art);
      });
    } else if (topicCard) {
      generateArticleForTopic(topicCard);
    }
  }, [topicCard, articleId]);

  const generateArticleForTopic = async (card: TopicCard) => {
    setIsGenerating(true);
    setStreamingText('');

    try {
      const { markdown, gamePayload } = await geminiService.generateArticle(
        card.title,
        card.category,
        profile.readLengthMinutes || 5,
        profile.preferredModel || 'gemini-1.5-flash',
        (partial) => setStreamingText(partial)
      );

      const newArticle: Article = {
        id: `article-${Date.now()}`,
        profileId: profile.id,
        topicCardId: card.id,
        title: card.title,
        category: card.category,
        tags: [card.category.toLowerCase().replace(/\s+/g, '-')],
        readTimeMinutes: profile.readLengthMinutes || 5,
        markdownContent: markdown,
        gamePayload,
        gameCompleted: false,
        readAt: new Date(),
        createdAt: new Date()
      };

      await db.articles.add(newArticle);
      await db.topicCards.update(card.id, { status: 'completed' });
      setArticle(newArticle);

      // Enqueue sync mutation & evaluate badges
      syncManager.enqueueArticlePush(newArticle);
      syncManager.enqueueReadingLog(profile.id, newArticle.id, newArticle.readTimeMinutes, false);
      checkBadges();
    } catch (e) {
      console.error('Error generating article:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGameComplete = async (artId: string) => {
    await db.articles.update(artId, { gameCompleted: true });
    setArticle(prev => prev ? { ...prev, gameCompleted: true } : null);

    syncManager.enqueueReadingLog(profile.id, artId, 0, true);
    checkBadges();
  };

  const checkBadges = async () => {
    const articles = await db.articles.where('profileId').equals(profile.id).toArray();
    const existingBadges = await db.badges.where('profileId').equals(profile.id).toArray();
    const newBadges = evaluateBadges(profile.id, articles, existingBadges);
    if (newBadges.length > 0) {
      await db.badges.bulkAdd(newBadges);
    }
  };

  if (isGenerating) {
    return (
      <div className="max-w-xl mx-auto p-6 text-slate-300">
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <RefreshCw size={24} className="animate-spin text-emerald-400 flex-shrink-0" />
          <div>
            <h3 className="text-base font-bold text-white">Generating Micro-Learning Article</h3>
            <p className="text-xs text-slate-400">Title: {topicCard?.title}</p>
          </div>
        </div>
        {streamingText && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {streamingText}
          </div>
        )}
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No article loaded.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded">Back</button>
      </div>
    );
  }

  return <ArticleReader article={article} onBack={onBack} onGameComplete={handleGameComplete} />;
}
