export interface Profile {
  id: string;
  name: string;
  avatarEmoji: string;
  categories: string[];
  readLengthMinutes: number;
  preferredModel?: string;
  preferredTopicModel?: string;
  feedLayoutMode?: 'swipe' | 'classic';
  createdAt: Date;
}

export interface TopicCard {
  id: string;
  profileId: string;
  title: string;
  subtitle: string;
  category: string;
  isWildcard: boolean;
  generatedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'reading' | 'dismissed' | 'completed' | 'saved_for_later';
}

export type GameType = 'wordle' | 'flashcard' | 'concept_match' | 'crossword' | 'word_search';

export interface WordleGame {
  targetWord: string;
  hint: string;
  maxAttempts?: number;
}

export interface FlashcardGame {
  cards: { front: string; back: string }[];
}

export interface ConceptMatchGame {
  pairs: { term: string; definition: string }[];
}

export interface CrosswordGame {
  gridSize: { rows: number; cols: number };
  clues: {
    number: number;
    direction: 'across' | 'down';
    clue: string;
    answer: string;
    startRow: number;
    startCol: number;
  }[];
}

export interface WordSearchGame {
  gridSize: number;
  grid: string[][];
  words: { word: string; hint: string }[];
}

export interface GamePayload {
  type: GameType;
  data: WordleGame | FlashcardGame | ConceptMatchGame | CrosswordGame | WordSearchGame;
}

export interface Article {
  id: string;
  profileId: string;
  topicCardId?: string;
  title: string;
  category: string;
  tags: string[];
  readTimeMinutes: number;
  markdownContent: string;
  yamlFrontmatter?: string;
  gamePayload: GamePayload | null;
  gameCompleted: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export type BadgeType =
  | 'explorer'
  | 'streak'
  | 'puzzle_master'
  | 'category_master'
  | 'wildcard_fan';

export interface Badge {
  id: string;
  profileId: string;
  type: BadgeType;
  tier: number;
  title: string;
  description: string;
  unlockedAt: Date;
  linkedArticleId?: string;
}

export interface SyncQueueEntry {
  id?: number;
  profileId: string;
  action: 'push_article' | 'push_stats' | 'log_reading';
  payload: any;
  createdAt: Date;
  retries: number;
}

export interface SourceLink {
  title: string;
  url: string;
  lessonTitle?: string;
}

export interface CourseNode {
  id: string;
  courseId: string;
  profileId: string;
  title: string;
  description: string;
  prerequisites: string[]; // Parent node IDs in the DAG
  tags: string[];
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  completedAt?: Date;
  articleId?: string;
  savedFilePath?: string;
  timeSpentMinutes?: number;
  markdownContent?: string;
  gamePayload?: GamePayload | null;
  sources?: SourceLink[];
}

export interface Course {
  id: string;
  profileId: string;
  title: string;
  topicPrompt: string;
  folderName: string;
  status: 'active' | 'completed' | 'archived';
  progressPercentage: number;
  compiledResources?: SourceLink[];
  createdAt: Date;
  updatedAt: Date;
}


