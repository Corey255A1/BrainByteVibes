import { useState, useEffect } from 'preact/hooks';
import type { Profile, TopicCard as ITopicCard } from '../types';
import { db } from '../db/database';
import { geminiService } from '../services/gemini';
import { TopicDeck } from '../components/feed/TopicDeck';
import { SwipeTopicDeck } from '../components/feed/SwipeTopicDeck';
import { WildcardButton } from '../components/feed/WildcardButton';

interface Props {
  profile: Profile;
  onSelectTopic: (topic: ITopicCard) => void;
}

export function FeedPage({ profile, onSelectTopic }: Props) {
  const [topics, setTopics] = useState<ITopicCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWildcardLoading, setIsWildcardLoading] = useState(false);
  const [isBackgroundReplenishing, setIsBackgroundReplenishing] = useState(false);

  const layoutMode = profile.feedLayoutMode || 'swipe';

  const loadTopics = async () => {
    const active = await db.topicCards
      .where('profileId')
      .equals(profile.id)
      .filter(t => t.status === 'pending')
      .toArray();

    if (active.length > 0) {
      setTopics(active);
    } else {
      generateFreshDeck();
    }
  };

  useEffect(() => {
    loadTopics();
  }, [profile.id]);

  const generateFreshDeck = async () => {
    setIsLoading(true);
    try {
      const readArticles = await db.articles.where('profileId').equals(profile.id).toArray();
      const history = readArticles.map(a => a.title);

      const items = await geminiService.fetchTopics(
        profile.categories,
        history,
        profile.preferredTopicModel || 'gemini-1.5-flash-8b'
      );
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const newCards: ITopicCard[] = items.map((item, idx) => ({
        id: `topic-${Date.now()}-${idx}`,
        profileId: profile.id,
        title: item.title,
        subtitle: item.subtitle,
        category: item.category || profile.categories[0] || 'General',
        isWildcard: false,
        generatedAt: now,
        expiresAt,
        status: 'pending'
      }));

      await db.topicCards.bulkAdd(newCards);
      setTopics(newCards);
    } catch (e) {
      console.error('Error generating topic deck:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackgroundReplenish = async () => {
    if (isBackgroundReplenishing || isLoading) return;
    setIsBackgroundReplenishing(true);

    try {
      const readArticles = await db.articles.where('profileId').equals(profile.id).toArray();
      const history = readArticles.map(a => a.title);

      const items = await geminiService.fetchTopics(
        profile.categories,
        history,
        profile.preferredTopicModel || 'gemini-1.5-flash-8b'
      );
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const newCards: ITopicCard[] = items.map((item, idx) => ({
        id: `topic-${Date.now()}-${idx}`,
        profileId: profile.id,
        title: item.title,
        subtitle: item.subtitle,
        category: item.category || profile.categories[0] || 'General',
        isWildcard: false,
        generatedAt: now,
        expiresAt,
        status: 'pending'
      }));

      await db.topicCards.bulkAdd(newCards);
      setTopics(prev => [...prev, ...newCards]);
    } catch (e) {
      console.warn('Background replenish error:', e);
    } finally {
      setIsBackgroundReplenishing(false);
    }
  };

  const handleWildcard = async () => {
    setIsWildcardLoading(true);
    try {
      const wildcardItem = await geminiService.fetchWildcard(
        profile.categories,
        profile.preferredTopicModel || 'gemini-1.5-flash-8b'
      );
      const now = new Date();
      const card: ITopicCard = {
        id: `topic-wildcard-${Date.now()}`,
        profileId: profile.id,
        title: wildcardItem.title,
        subtitle: wildcardItem.subtitle,
        category: wildcardItem.category || 'Wildcard',
        isWildcard: true,
        generatedAt: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        status: 'pending'
      };

      await db.topicCards.add(card);
      setTopics(prev => [card, ...prev]);
    } catch (e) {
      console.error('Error generating wildcard:', e);
    } finally {
      setIsWildcardLoading(false);
    }
  };

  const handleDismiss = async (topicId: string) => {
    await db.topicCards.update(topicId, { status: 'dismissed' });
    setTopics(prev => prev.filter(t => t.id !== topicId));
  };

  const handleSaveForLater = async (topicId: string) => {
    await db.topicCards.update(topicId, { status: 'saved_for_later' });
    setTopics(prev => prev.filter(t => t.id !== topicId));
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24 flex flex-col gap-6">
      <WildcardButton onClick={handleWildcard} isLoading={isWildcardLoading} />

      {layoutMode === 'swipe' ? (
        <SwipeTopicDeck
          topics={topics}
          onRead={onSelectTopic}
          onPass={handleDismiss}
          onSaveForLater={handleSaveForLater}
          onNeedsReplenish={handleBackgroundReplenish}
          isReplenishing={isBackgroundReplenishing || isLoading}
        />
      ) : (
        <TopicDeck
          topics={topics}
          onRead={onSelectTopic}
          onDismiss={handleDismiss}
          onRefresh={generateFreshDeck}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
