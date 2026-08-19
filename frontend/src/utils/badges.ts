import type { Article, Badge } from '../types';
import { calculateStreak } from './dates';

export function evaluateBadges(profileId: string, articles: Article[], existingBadges: Badge[]): Badge[] {
  const newBadges: Badge[] = [];
  const existingTypes = new Set(existingBadges.map(b => `${b.type}_${b.tier}`));

  const readArticles = articles.filter(a => a.readAt !== null);
  const totalRead = readArticles.length;
  const gamesCompleted = readArticles.filter(a => a.gameCompleted).length;
  const readDates = readArticles.map(a => new Date(a.readAt!));
  const currentStreak = calculateStreak(readDates);

  // Explorer Tiers
  if (totalRead >= 3 && !existingTypes.has('explorer_1')) {
    newBadges.push({
      id: `${profileId}_explorer_1`,
      profileId,
      type: 'explorer',
      tier: 1,
      title: 'Explorer Tier 1',
      description: 'Read your first 3 micro-learning articles!',
      unlockedAt: new Date()
    });
  }
  if (totalRead >= 10 && !existingTypes.has('explorer_2')) {
    newBadges.push({
      id: `${profileId}_explorer_2`,
      profileId,
      type: 'explorer',
      tier: 2,
      title: 'Explorer Tier 2',
      description: 'Expanded your knowledge with 10 articles!',
      unlockedAt: new Date()
    });
  }
  if (totalRead >= 25 && !existingTypes.has('explorer_3')) {
    newBadges.push({
      id: `${profileId}_explorer_3`,
      profileId,
      type: 'explorer',
      tier: 3,
      title: 'Master Explorer',
      description: 'Achieved 25 articles read!',
      unlockedAt: new Date()
    });
  }

  // Streak Tiers
  if (currentStreak >= 3 && !existingTypes.has('streak_1')) {
    newBadges.push({
      id: `${profileId}_streak_1`,
      profileId,
      type: 'streak',
      tier: 1,
      title: '3-Day Streak',
      description: 'Learned 3 days in a row!',
      unlockedAt: new Date()
    });
  }
  if (currentStreak >= 7 && !existingTypes.has('streak_2')) {
    newBadges.push({
      id: `${profileId}_streak_2`,
      profileId,
      type: 'streak',
      tier: 2,
      title: '7-Day Streak',
      description: 'Maintained a full week learning streak!',
      unlockedAt: new Date()
    });
  }

  // Puzzle Master
  if (gamesCompleted >= 5 && !existingTypes.has('puzzle_master_1')) {
    newBadges.push({
      id: `${profileId}_puzzle_master_1`,
      profileId,
      type: 'puzzle_master',
      tier: 1,
      title: 'Puzzle Master Tier 1',
      description: 'Completed 5 mini-game drills!',
      unlockedAt: new Date()
    });
  }

  return newBadges;
}
