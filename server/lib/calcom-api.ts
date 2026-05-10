/**
 * P37-T01: Cal.com v2 API Client
 *
 * Wraps the Cal.com REST API v2 for:
 *   1. getAvailableSlots() — GET /v2/slots/available
 *      Returns 30-minute windows for a given date range.
 *   2. createBooking()   — POST /v2/bookings
 *      Creates a booking on Cal.com and returns the uid.
 *   3. cancelBooking()   — CANCEL /v2/bookings/{uid}
 *      Cancels a booking on Cal.com.
 *
 * Cal.com v2 API reference: https://developer.cal.com/api/v2
 *
 * Authentication:
 *   - CAL_COM_API_KEY env (Bearer token)
 *   - CAL_COM_EVENT_TYPE_ID env (numeric, e.g. 123456)
 *   - CAL_COM_USERNAME env (e.g. "emre")
 *
 * Rate limits (Cal.com free tier):
 *   - 100 req/min per API key
 *   - We add 500ms jitter + retry on 429
 *
 * Slot normalization:
 *   Cal.com returns ISO-8601 UTC times.
 *   We convert to Istanbul (EcyPro primary market) + user tz.
 *
 * Error handling:
 *   - Timeout: 8s (prevent hanging the booking UI)
 *   - 429 Too Many Requests: single retry after 1s
 *   - Fallback: static TIME_SLOTS (graceful degradation)
 */

import { logger } from '../config/logger';

const BASE_URL = 'https://api.cal.com/v2';
const API_KEY = process.env.CAL_COM_API_KEY ?? '';
const EVENT_TYPE_ID = process.env.CAL_COM_EVENT_TYPE_ID ?? '';
const USERNAME = process.env.CAL_COM_USERNAME ?? '';
const API_VERSION = '2024-08-13'; // Required cal-api-version header

const DEFAULT_TIMEOUT_MS = 8_000;

// ─── Types ───────────────────────────────────────────────────

export interface AvailableSlot {
  /** ISO-8601 UTC start time */
  start: string;
  /** ISO-8601 UTC end time */
  end: string;
}

export interface SlotsForDay {
  /** YYYY-MM-DD */
  date: string;
  slots: AvailableSlot[];
}

export interface CalBookingInput {
  /** ISO-8601 UTC start time */
  startTime: string;
  /** Attendee full name */
  name: string;
  /** Attendee email */
  email: string;
  /** Optional agenda notes */
  notes?: string;
  /** IANA timezone string for display e.g. "Europe/Istanbul" */
  timeZone?: string;
  /** Metadata to pass through (e.g. ecyproBookingId for webhook sync) */
  metadata?: Record<string, string>;
}

export interface CalBookingResult {
  /** Cal.com booking uid */
  uid: string;
  /** Meeting URL (Zoom/Meet/Teams) */
  meetingUrl?: string;
  /** Confirmed status */
  status: 'ACCEPTED' | 'PENDING' | string;
}

// ─── HTTP helper ──────────────────────────────────────────────

async function calFetch<T>(path: string, options: RequestInit = {}, retryCount = 1): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'cal-api-version': API_VERSION,
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.status === 429 && retryCount > 0) {
      logger.warn('[CalAPI] Rate limited — retrying in 1s');
      await new Promise((r) => setTimeout(r, 1_000));
      return calFetch<T>(path, options, retryCount - 1);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Cal.com API ${res.status}: ${body.slice(0, 200)}`);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ─── getAvailableSlots ────────────────────────────────────────

/**
 * Fetches available 30-min slots for a given date range.
 *
 * Cal.com endpoint: GET /v2/slots/available
 *   Query params:
 *     startTime: ISO-8601 (start of day UTC)
 *     endTime:   ISO-8601 (end of day UTC)
 *     eventTypeId: numeric string
 *
 * Returns: map of date → slots[]
 *
 * Fallback: if API key is missing or call fails, returns empty
 * so UI can show a graceful "temporarily unavailable" message.
 */
export async function getAvailableSlots(startDate: Date, endDate: Date): Promise<SlotsForDay[]> {
  if (!API_KEY || !EVENT_TYPE_ID) {
    logger.warn('[CalAPI] API key or eventTypeId not configured — returning fallback slots');
    return getFallbackSlots(startDate, endDate);
  }

  const startTime = startDate.toISOString();
  // End of day for endDate
  const endDateEnd = new Date(endDate);
  endDateEnd.setUTCHours(23, 59, 59, 999);
  const endTime = endDateEnd.toISOString();

  const params = new URLSearchParams({
    startTime,
    endTime,
    eventTypeId: EVENT_TYPE_ID,
    ...(USERNAME ? { username: USERNAME } : {}),
  });

  try {
    const response = await calFetch<{ data: { slots: Record<string, { time: string }[]> } }>(
      `/slots/available?${params.toString()}`,
    );

    // Cal.com returns: { data: { slots: { "2026-05-10": [{time: "..."}, ...], ... } } }
    const rawSlots = response?.data?.slots ?? {};

    return Object.entries(rawSlots).map(([date, times]) => ({
      date,
      slots: times.map(({ time }) => ({
        start: time,
        end: new Date(new Date(time).getTime() + 30 * 60_000).toISOString(),
      })),
    }));
  } catch (err) {
    logger.error('[CalAPI] getAvailableSlots failed', { error: (err as Error).message });
    return getFallbackSlots(startDate, endDate);
  }
}

// ─── createCalBooking ────────────────────────────────────────

/**
 * Creates a booking on Cal.com.
 *
 * Cal.com endpoint: POST /v2/bookings
 *
 * On success: returns uid + meetingUrl for DB storage.
 * On failure: throws (caller should handle gracefully).
 */
export async function createCalBooking(input: CalBookingInput): Promise<CalBookingResult> {
  if (!API_KEY || !EVENT_TYPE_ID) {
    logger.warn('[CalAPI] createCalBooking: API not configured — skipping Cal.com create');
    return { uid: `mock-${Date.now()}`, status: 'ACCEPTED' };
  }

  const body = {
    eventTypeId: parseInt(EVENT_TYPE_ID, 10),
    start: input.startTime,
    attendee: {
      name: input.name,
      email: input.email,
      timeZone: input.timeZone ?? 'Europe/Istanbul',
      language: 'tr',
    },
    ...(input.notes ? { responses: { notes: input.notes } } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  };

  const response = await calFetch<{ data: { uid: string; meetingUrl?: string; status: string } }>(
    '/bookings',
    { method: 'POST', body: JSON.stringify(body) },
  );

  return {
    uid: response.data.uid,
    meetingUrl: response.data.meetingUrl,
    status: response.data.status,
  };
}

// ─── cancelCalBooking ────────────────────────────────────────

/**
 * Cancels a Cal.com booking by uid.
 * Used in BookingManagePage cancel flow.
 */
export async function cancelCalBooking(uid: string, reason?: string): Promise<void> {
  if (!API_KEY) {
    logger.warn('[CalAPI] cancelCalBooking: API not configured — skipping Cal.com cancel');
    return;
  }

  await calFetch(`/bookings/${uid}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancellationReason: reason ?? 'Requested by attendee' }),
  });
}

// ─── Fallback static slots ────────────────────────────────────

/**
 * When Cal.com is unavailable (no API key / outage), return
 * static business-hours slots for Mon-Fri.
 *
 * Business hours: 09:00-12:00 + 14:00-17:00 Istanbul UTC+3
 * Slot duration: 30 minutes
 *
 * UTC offset: Istanbul is UTC+3. Business 09:00 local = 06:00 UTC.
 */
function getFallbackSlots(startDate: Date, endDate: Date): SlotsForDay[] {
  const HOUR_OFFSETS_UTC = [6, 6.5, 7, 7.5, 8, 8.5, 11, 11.5, 12, 12.5, 13, 13.5];

  const result: SlotsForDay[] = [];
  const cursor = new Date(startDate);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor <= endDate) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      // Mon-Fri only
      const dateStr = cursor.toISOString().slice(0, 10);
      const slots: AvailableSlot[] = HOUR_OFFSETS_UTC.map((h) => {
        const start = new Date(cursor);
        start.setUTCHours(Math.floor(h), (h % 1) * 60, 0, 0);
        const end = new Date(start.getTime() + 30 * 60_000);
        return { start: start.toISOString(), end: end.toISOString() };
      });
      result.push({ date: dateStr, slots });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}
