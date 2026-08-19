import { db } from '../db/database';
import type { Article, SyncQueueEntry } from '../types';

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

  public async enqueueArticlePush(article: Article): Promise<void> {
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
        frontmatter: {
          id: article.id,
          title: article.title,
          category: article.category,
          tags: article.tags,
          user: article.profileId,
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
}

export const syncManager = new SyncManager();
