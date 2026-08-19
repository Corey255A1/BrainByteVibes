import type { Badge } from '../../types';
import { Zap, Puzzle, Compass, Star } from 'lucide-react';
import { formatDate } from '../../utils/dates';

interface Props {
  badge: Badge;
}

export function BadgeCard({ badge }: Props) {
  const getIcon = () => {
    switch (badge.type) {
      case 'explorer': return Compass;
      case 'streak': return Zap;
      case 'puzzle_master': return Puzzle;
      default: return Star;
    }
  };

  const Icon = getIcon();

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 transition-all hover:border-slate-700">
      <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-400">
        <Icon size={24} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-100">{badge.title}</h4>
        <p className="text-xs text-slate-400 mt-0.5">{badge.description}</p>
        <span className="text-[10px] text-slate-500 mt-2 block">Unlocked: {formatDate(badge.unlockedAt)}</span>
      </div>
    </div>
  );
}
