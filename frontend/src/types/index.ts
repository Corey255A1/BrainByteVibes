export interface Profile {
  id: string;
  name: string;
  avatarEmoji: string;
  categories: string[];
  readLengthMinutes: number;
  preferredModel?: string;
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
