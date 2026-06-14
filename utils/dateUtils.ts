/**
 * Returns today's date in YYYY-MM-DD format based on local system time.
 */
export function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD date or ISO date string into a user-friendly date format.
 * - 'short': e.g., "Mon, Jun 15"
 * - 'long': e.g., "June 15, 2026"
 */
export function formatDate(dateStr: string, formatStyle: 'short' | 'long' = 'short'): string {
  if (!dateStr) return '';
  
  // Normalize YYYY-MM-DD to date object using local time to avoid timezone offset shifts
  const parts = dateStr.split('T')[0].split('-');
  let date: Date;
  if (parts.length === 3) {
    date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  } else {
    date = new Date(dateStr);
  }

  if (isNaN(date.getTime())) return dateStr;

  if (formatStyle === 'short') {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Checks if a given date string matches today's date in local time.
 */
export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const normalizedStr = dateStr.split('T')[0];
  return normalizedStr === todayISO();
}
