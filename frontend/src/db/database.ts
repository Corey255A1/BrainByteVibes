import Dexie, { type Table } from 'dexie';
import type { Profile, TopicCard, Article, Badge, SyncQueueEntry, Course, CourseNode } from '../types';

export class AntiScrollDB extends Dexie {
  profiles!: Table<Profile, string>;
  topicCards!: Table<TopicCard, string>;
  articles!: Table<Article, string>;
  badges!: Table<Badge, string>;
  syncQueue!: Table<SyncQueueEntry, number>;
  courses!: Table<Course, string>;
  courseNodes!: Table<CourseNode, string>;

  constructor() {
    super('AntiScrollDB');
    this.version(1).stores({
      profiles: 'id, name',
      topicCards: 'id, profileId, status, category, expiresAt',
      articles: 'id, profileId, category, gameCompleted, createdAt',
      badges: 'id, profileId, type, tier',
      syncQueue: '++id, profileId, action, createdAt'
    });
    this.version(2).stores({
      profiles: 'id, name',
      topicCards: 'id, profileId, status, category, expiresAt',
      articles: 'id, profileId, category, gameCompleted, createdAt',
      badges: 'id, profileId, type, tier',
      syncQueue: '++id, profileId, action, createdAt',
      courses: 'id, profileId, status, updatedAt',
      courseNodes: 'id, courseId, profileId, status'
    });
  }
}

export const db = new AntiScrollDB();


