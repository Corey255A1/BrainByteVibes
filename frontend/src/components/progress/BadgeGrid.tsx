import type { Badge } from '../../types';
import { BadgeCard } from './BadgeCard';

interface Props {
  badges: Badge[];
}

export function BadgeGrid({ badges }: Props) {
  if (badges.length === 0) {
    return (
      <div className="p-6 text-center bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 text-xs">
        No milestone badges unlocked yet. Keep reading articles and completing mini-games!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {badges.map(b => (
        <BadgeCard key={b.id} badge={b} />
      ))}
    </div>
  );
}
