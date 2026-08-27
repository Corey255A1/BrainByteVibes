import { db } from '../db/database';
import type { Article, SyncQueueEntry, Profile } from '../types';

export class SyncManager {
  private backendUrl = localStorage.getItem('antiscroll_backend_url') || 'http://localhost:8000/api';

  public getBackendUrl(): string {
    return this.backendUrl;
  }

  public setBackendUrl(url: string): void {
    this.backendUrl = url;
    localStorage.setItem('antiscroll_backend_url', url);
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.backendUrl.replace(/\/api$/, '')}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async enqueueArticlePush(article: Article, userName?: string): Promise<void> {
    await db.syncQueue.add({
      profileId: article.profileId,
      action: 'push_article',
      payload: {
        id: article.id,
        title: article.title,
        category: article.category,
        tags: article.tags,
        readTimeMinutes: article.readTimeMinutes,
        markdownContent: article.markdownContent,
        gameType: article.gamePayload?.type || null,
        gameCompleted: article.gameCompleted,
        userName: userName || article.profileId,
        frontmatter: {
          id: article.id,
          title: article.title,
          category: article.category,
          tags: article.tags,
          user: userName || article.profileId,
          read_time_minutes: article.readTimeMinutes
        }
      },
      createdAt: new Date(),
      retries: 0
    });

    this.processSyncQueue();
  }

  public async enqueueReadingLog(profileId: string, articleId: string, minutesSpent: number, gameCompleted: boolean): Promise<void> {
    await db.syncQueue.add({
      profileId,
      action: 'log_reading',
      payload: { articleId, minutesSpent, gameCompleted },
      createdAt: new Date(),
      retries: 0
    });

    this.processSyncQueue();
  }

  public async processSyncQueue(): Promise<{ processed: number; errors: number }> {
    const isOnline = await this.checkHealth();
    if (!isOnline) return { processed: 0, errors: 0 };

    const items = await db.syncQueue.toArray();
    if (items.length === 0) return { processed: 0, errors: 0 };

    // Group items by profileId
    const profileMap = new Map<string, SyncQueueEntry[]>();
    items.forEach(item => {
      const list = profileMap.get(item.profileId) || [];
      list.push(item);
      profileMap.set(item.profileId, list);
    });

    let totalProcessed = 0;
    let totalErrors = 0;

    for (const [profileId, entries] of profileMap.entries()) {
      try {
        const mutations = entries.map(e => ({
          action: e.action,
          payload: e.payload
        }));

        const response = await fetch(`${this.backendUrl}/sync/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: profileId, mutations })
        });

        if (response.ok) {
          const idsToRemove = entries.map(e => e.id!).filter(Boolean);
          await db.syncQueue.bulkDelete(idsToRemove);
          totalProcessed += entries.length;
        } else {
          totalErrors += entries.length;
        }
      } catch (e) {
        totalErrors += entries.length;
      }
    }

    return { processed: totalProcessed, errors: totalErrors };
  }

  public async pushUserProfile(profile: Profile): Promise<boolean> {
    try {
      const payload = {
        id: profile.id,
        name: profile.name,
        avatar_emoji: profile.avatarEmoji,
        categories: JSON.stringify(profile.categories),
        read_length_minutes: profile.readLengthMinutes,
        preferred_model: profile.preferredModel || 'gemini-1.5-flash',
        preferred_topic_model: profile.preferredTopicModel || 'gemini-1.5-flash-8b',
        feed_layout_mode: profile.feedLayoutMode || 'swipe'
      };
      const res = await fetch(`${this.backendUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (e) {
      console.warn('Failed to push user profile to backend:', e);
      return false;
    }
  }

  public async fetchRemoteUsers(): Promise<Profile[]> {
    try {
      const res = await fetch(`${this.backendUrl}/users`);
      if (res.ok) {
        const users = await res.json();
        return users.map((u: any) => ({
          id: u.id,
          name: u.name,
          avatarEmoji: u.avatar_emoji || '🧑‍💻',
          categories: typeof u.categories === 'string' ? JSON.parse(u.categories || '[]') : (u.categories || []),
          readLengthMinutes: u.read_length_minutes || 5,
          preferredModel: u.preferred_model || 'gemini-1.5-flash',
          preferredTopicModel: u.preferred_topic_model || 'gemini-1.5-flash-8b',
          feedLayoutMode: (u.feed_layout_mode as 'swipe' | 'classic') || 'swipe',
          createdAt: u.created_at ? new Date(u.created_at) : new Date()
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch remote users from backend:', e);
    }
    return [];
  }

  public async pullUserSync(profileId: string): Promise<Profile | null> {
    try {
      // 1. Fetch remote user settings
      const remoteUsers = await this.fetchRemoteUsers();
      const remoteProfile = remoteUsers.find(u => u.id === profileId);
      if (remoteProfile) {
        await db.profiles.put(remoteProfile);
      }

      // 2. Fetch remote articles for user
      const res = await fetch(`${this.backendUrl}/sync/pull/${profileId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.articles && Array.isArray(data.articles)) {
          for (const art of data.articles) {
            const existing = await db.articles.get(art.id);
            if (!existing) {
              await db.articles.add({
                id: art.id,
                profileId,
                title: art.title,
                category: art.category,
                tags: art.tags || [],
                readTimeMinutes: art.readTimeMinutes || 5,
                markdownContent: art.markdownContent || '',
                gamePayload: art.gameType ? { type: art.gameType, data: {} as any } : null,
                gameCompleted: Boolean(art.gameCompleted),
                readAt: art.createdAt ? new Date(art.createdAt) : new Date(),
                createdAt: art.createdAt ? new Date(art.createdAt) : new Date()
              });
            }
          }
        }
      }

      // 3. Return updated local profile
      return (await db.profiles.get(profileId)) || remoteProfile || null;
    } catch (e) {
      console.warn('Failed to pull user sync from backend:', e);
      return (await db.profiles.get(profileId)) || null;
    }
  }
}

export const syncManager = new SyncManager();

