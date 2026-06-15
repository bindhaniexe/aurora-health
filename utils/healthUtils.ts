import { todayISO } from './dateUtils';

/**
 * Calculates the percentage of the water goal met. Capped at 100%.
 */
export function hydrationPercent(ml: number, goalMl: number): number {
  if (goalMl <= 0) return 0;
  return Math.min(100, Math.round((ml / goalMl) * 100));
}

/**
 * Categorizes sleep quality based on duration.
 */
export function sleepQualityLabel(hrs: number): 'poor' | 'fair' | 'good' | 'great' {
  if (hrs < 6) return 'poor';
  if (hrs < 7) return 'fair';
  if (hrs < 9) return 'good';
  return 'great';
}

/**
 * Computes current consecutive habit completion streak backwards from today or yesterday.
 * Expects an array of objects containing `completed_date` (format YYYY-MM-DD).
 */
export function streakCount(completions: { completed_date: string }[]): number {
  if (!completions || completions.length === 0) return 0;

  // Extract date portion and sort in descending order (latest first)
  const uniqueDates = Array.from(
    new Set(completions.map(c => c.completed_date.split('T')[0]))
  ).sort((a, b) => b.localeCompare(a));

  if (uniqueDates.length === 0) return 0;

  const todayStr = todayISO();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const latestDate = uniqueDates[0];

  // If latest completion is neither today nor yesterday, the streak is broken (0)
  if (latestDate !== todayStr && latestDate !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(latestDate);

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDateStr = uniqueDates[i];
    const prevDate = new Date(prevDateStr);

    // Calculate difference in calendar days
    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else if (diffDays > 1) {
      // Gap found, streak ends
      break;
    }
    // If diffDays is 0 (duplicate dates), ignore and continue
  }

  return streak;
}
