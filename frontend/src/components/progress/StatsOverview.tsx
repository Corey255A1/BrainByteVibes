import { BookOpen, Clock, Flame, Gamepad2 } from 'lucide-react';

interface Props {
  totalArticles: number;
  totalMinutes: number;
  currentStreak: number;
  totalGames: number;
}

export function StatsOverview({ totalArticles, totalMinutes, currentStreak, totalGames }: Props) {
  const stats = [
    { label: 'Articles Read', value: totalArticles, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-950/40' },
    { label: 'Minutes Spent', value: totalMinutes, icon: Clock, color: 'text-sky-400', bg: 'bg-sky-950/40' },
    { label: 'Daily Streak', value: `${currentStreak} d`, icon: Flame, color: 'text-amber-400', bg: 'bg-amber-950/40' },
    { label: 'Puzzles Solved', value: totalGames, icon: Gamepad2, color: 'text-purple-400', bg: 'bg-purple-950/40' }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((s, idx) => {
        const Icon = s.icon;
        return (
          <div key={idx} className={`p-4 rounded-xl border border-slate-800 ${s.bg} flex flex-col justify-between`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400">{s.label}</span>
              <Icon size={18} className={s.color} />
            </div>
            <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
          </div>
        );
      })}
    </div>
  );
}
