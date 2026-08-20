import Dexie, { type Table } from 'dexie';
import type { Profile, TopicCard, Article, Badge, SyncQueueEntry } from '../types';

export class AntiScrollDB extends Dexie {
  profiles!: Table<Profile, string>;
  topicCards!: Table<TopicCard, string>;
  articles!: Table<Article, string>;
  badges!: Table<Badge, string>;
  syncQueue!: Table<SyncQueueEntry, number>;

  constructor() {
    super('AntiScrollDB');
    this.version(1).stores({
      profiles: 'id, name',
      topicCards: 'id, profileId, status, category, expiresAt',
      articles: 'id, profileId, category, gameCompleted, createdAt',
      badges: 'id, profileId, type, tier',
      syncQueue: '++id, profileId, action, createdAt'
    });
  }
}

export const db = new AntiScrollDB();

// Helper to initialize default profile if empty
export async function ensureDefaultProfile(): Promise<Profile> {
  const count = await db.profiles.count();
  if (count === 0) {
    const defaultProfile: Profile = {
      id: 'default-user',
      name: 'Corey',
      avatarEmoji: '🧑‍💻',
      categories: ['Software Architecture', 'C++', 'Math Puzzles', 'Music Theory', 'Science'],
      readLengthMinutes: 5,
      feedLayoutMode: 'swipe',
      createdAt: new Date()
    };
    await db.profiles.add(defaultProfile);
    return defaultProfile;
  }
  const profiles = await db.profiles.toArray();
  return profiles[0];
}
