export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function calculateStreak(readDates: Date[]): number {
  if (!readDates || readDates.length === 0) return 0;

  // Convert to sorted unique date strings (YYYY-MM-DD)
  const uniqueDates = Array.from(
    new Set(readDates.map(d => new Date(d).toISOString().split('T')[0]))
  ).sort().reverse();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let streak = 0;
  let checkDate = uniqueDates[0] === today ? today : (uniqueDates[0] === yesterday ? yesterday : null);

  if (!checkDate) return 0;

  let current = new Date(checkDate);
  for (const dStr of uniqueDates) {
    const expectedStr = current.toISOString().split('T')[0];
    if (dStr === expectedStr) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
