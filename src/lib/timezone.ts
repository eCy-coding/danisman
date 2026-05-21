/**
 * P37-T07: Timezone-Aware Date Utilities
 *
 * Detects user's browser timezone and formats booking times accordingly.
 * Uses date-fns-tz for IANA timezone conversions.
 *
 * Booking data stored as UTC in DB. All display is timezone-converted.
 *
 * Example output:
 *   formatBookingTime(date, 'America/New_York')
 *   → { local: "15:00 EST", istanbul: "22:00 TRT", offset: "UTC-5" }
 *
 * Usage:
 *   const tz = getUserTimezone();          // "America/New_York"
 *   const label = getTzLabel(tz);          // "New York (UTC-5)"
 *   const { local, istanbul } = formatBookingTime(date, tz);
 */

import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { tr, enUS } from 'date-fns/locale';

export const ISTANBUL_TZ = 'Europe/Istanbul';

/**
 * Get the user's browser timezone (IANA format).
 * Falls back to Istanbul (eCyPro's primary market) if detection fails.
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ISTANBUL_TZ;
  } catch {
    return ISTANBUL_TZ;
  }
}

/**
 * Get UTC offset string for a timezone at a given date.
 * Example: getUtcOffset('America/New_York', new Date()) → "UTC-5"
 */
export function getUtcOffset(tz: string, date: Date = new Date()): string {
  try {
    const offsetStr = formatInTimeZone(date, tz, 'xxx'); // "+03:00" or "-05:00"
    const hours = parseInt(offsetStr.split(':')[0] ?? '0');
    return `UTC${hours >= 0 ? '+' : ''}${hours}`;
  } catch {
    return 'UTC';
  }
}

/**
 * Format a UTC date for display in a specific timezone.
 * Returns formatted date string: "15 Mayıs 2026, 14:30"
 */
export function formatInTz(
  date: Date,
  tz: string,
  pattern = 'dd MMMM yyyy, HH:mm',
  locale: 'tr' | 'en' = 'tr',
): string {
  try {
    return formatInTimeZone(date, tz, pattern, { locale: locale === 'tr' ? tr : enUS });
  } catch {
    return format(date, pattern, { locale: locale === 'tr' ? tr : enUS });
  }
}

/**
 * Get human-readable timezone label.
 * Example: "Europe/Istanbul" → "İstanbul (UTC+3)"
 */
export function getTzLabel(tz: string, date: Date = new Date()): string {
  try {
    // Extract city name from IANA tz (e.g., "Europe/Istanbul" → "Istanbul")
    const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
    const offset = getUtcOffset(tz, date);
    return `${city} (${offset})`;
  } catch {
    return tz;
  }
}

export interface BookingTimeDisplay {
  /** Time in user's local timezone: "14:30 EST" */
  local: string;
  /** Time in Istanbul (eCyPro base): "22:30 TRT" */
  istanbul: string;
  /** UTC offset of user's timezone: "UTC-5" */
  offset: string;
  /** Whether user is NOT in Istanbul timezone */
  showDualTime: boolean;
  /** Full formatted label: "Tuesday, 15 May 2026 at 14:30 (New York, UTC-5)" */
  fullLabel: string;
}

/**
 * Format a booking date in both user timezone and Istanbul timezone.
 * Used by BookingModal to show dual-timezone display for international users.
 */
export function formatBookingTime(
  date: Date,
  userTz: string,
  locale: 'tr' | 'en' = 'tr',
): BookingTimeDisplay {
  const localTime = formatInTz(date, userTz, 'HH:mm', locale);
  const istanbulTime = formatInTz(date, ISTANBUL_TZ, 'HH:mm', locale);
  const offset = getUtcOffset(userTz, date);
  const showDualTime = userTz !== ISTANBUL_TZ && userTz !== 'Europe/Istanbul';
  const localTzLabel = getTzLabel(userTz, date);
  const dateStr = formatInTz(
    date,
    userTz,
    locale === 'tr' ? 'dd MMMM yyyy' : 'MMMM d, yyyy',
    locale,
  );
  const dayStr = formatInTz(date, userTz, locale === 'tr' ? 'EEEE' : 'EEEE', locale);

  const fullLabel =
    locale === 'tr'
      ? `${dayStr}, ${dateStr} · ${localTime} — ${localTzLabel}`
      : `${dayStr}, ${dateStr} at ${localTime} — ${localTzLabel}`;

  return { local: localTime, istanbul: istanbulTime, offset, showDualTime, fullLabel };
}
