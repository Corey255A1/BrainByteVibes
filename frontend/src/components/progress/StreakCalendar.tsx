interface Props {
  readDates: Date[];
}

export function StreakCalendar({ readDates }: Props) {
  const dateSet = new Set(
    readDates.map(d => new Date(d).toISOString().split('T')[0])
  );

  // Generate last 14 days
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const iso = d.toISOString().split('T')[0];
    const isRead = dateSet.has(iso);
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'narrow' });
    const numLabel = d.getDate();
    return { iso, isRead, dayLabel, numLabel };
  });

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-6">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">14-Day Activity Heatmap</h4>
      <div className="flex justify-between items-center gap-1">
        {days.map((d, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
            <div
              title={`${d.iso}: ${d.isRead ? 'Completed' : 'No activity'}`}
              className={`w-full aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                d.isRead
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/40'
              }`}
            >
              {d.numLabel}
            </div>
            <span className="text-[9px] text-slate-400">{d.dayLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
