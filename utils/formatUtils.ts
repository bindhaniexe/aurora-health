import { formatDate as dateUtilsFormat } from './dateUtils';

/**
 * Formats a hydration value in milliliters (e.g., "2,500 ml").
 */
export function formatMl(ml: number): string {
  return `${ml.toLocaleString()} ml`;
}

/**
 * Formats decimal sleep hours to dashboard H:MM Hours display (e.g., 7.5 -> "7:30 Hours").
 */
export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  const paddedMinutes = String(minutes).padStart(2, '0');
  return `${wholeHours}:${paddedMinutes} Hours`;
}

/**
 * Formats a date string into user-friendly presentation format.
 */
export function formatDate(dateStr: string, formatStyle: 'short' | 'long' = 'short'): string {
  return dateUtilsFormat(dateStr, formatStyle);
}
