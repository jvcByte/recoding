/**
 * WAT (West Africa Time) formatting utilities.
 * Africa/Lagos is permanently UTC+1 — no DST.
 * All timestamps are stored as UTC in the DB; these helpers convert for display only.
 */

const WAT_LOCALE = 'en-NG';
const WAT_TZ = 'Africa/Lagos';

/**
 * Format a UTC ISO string (or Date) as a full datetime in WAT.
 * e.g. "21/04/2026, 14:30:00 WAT"
 */
export function formatWAT(
  iso: string | Date,
  opts?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = typeof iso === 'string' ? new Date(iso) : iso;
    if (isNaN(date.getTime())) return 'Invalid Date WAT';
    const base: Intl.DateTimeFormatOptions = {
      timeZone: WAT_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      ...opts,
    };
    return date.toLocaleString(WAT_LOCALE, base) + ' WAT';
  } catch {
    return 'Invalid Date WAT';
  }
}

/**
 * Format a UTC ISO string (or Date) as a date-only string in WAT.
 * e.g. "21/04/2026"
 */
export function formatDateWAT(
  iso: string | Date,
  opts?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = typeof iso === 'string' ? new Date(iso) : iso;
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString(WAT_LOCALE, {
      timeZone: WAT_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...opts,
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format a UTC ISO string (or Date) as a time-only string in WAT.
 * e.g. "14:30:00 WAT"
 */
export function formatTimeWAT(
  iso: string | Date,
  opts?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = typeof iso === 'string' ? new Date(iso) : iso;
    if (isNaN(date.getTime())) return 'Invalid Date WAT';
    const base: Intl.DateTimeFormatOptions = {
      timeZone: WAT_TZ,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      ...opts,
    };
    return date.toLocaleTimeString(WAT_LOCALE, base) + ' WAT';
  } catch {
    return 'Invalid Date WAT';
  }
}
