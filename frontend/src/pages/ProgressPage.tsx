import { useState, useEffect } from 'preact/hooks';
import type { Profile, Article, Badge } from '../types';
import { db } from '../db/database';
import { StatsOverview } from '../components/progress/StatsOverview';
import { StreakCalendar } from '../components/progress/StreakCalendar';
import { BadgeGrid } from '../components/progress/BadgeGrid';
import { calculateStreak } from '../utils/dates';

interface Props {
  profile: Profile;
}

export function ProgressPage({ profile }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    db.articles.where('profileId').equals(profile.id).toArray().then(setArticles);
    db.badges.where('profileId').equals(profile.id).toArray().then(setBadges);
  }, [profile.id]);

  const readArticles = articles.filter(a => a.readAt !== null);
  const totalArticles = readArticles.length;
  const totalMinutes = readArticles.reduce((acc, a) => acc + (a.readTimeMinutes || 5), 0);
  const totalGames = readArticles.filter(a => a.gameCompleted).length;
  const readDates = readArticles.map(a => new Date(a.readAt!));
  const currentStreak = calculateStreak(readDates);

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24 flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-100 px-1">Learning Analytics & Badges</h1>

      <StatsOverview
        totalArticles={totalArticles}
        totalMinutes={totalMinutes}
        currentStreak={currentStreak}
        totalGames={totalGames}
      />

      <StreakCalendar readDates={readDates} />

      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Unlocked Milestone Badges ({badges.length})
        </h3>
        <BadgeGrid badges={badges} />
      </div>
    </div>
  );
}
