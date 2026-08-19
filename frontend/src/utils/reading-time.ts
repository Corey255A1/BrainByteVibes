export function calculateReadingTimeMinutes(markdownText: string): number {
  if (!markdownText) return 1;
  const words = markdownText.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return Math.max(1, minutes);
}
