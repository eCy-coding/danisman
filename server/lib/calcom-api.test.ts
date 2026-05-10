/**
 * P37-T01: Cal.com API Client — Unit Tests (fallback mode)
 *
 * Tests the `getAvailableSlots` fallback path (no Cal.com API key)
 * and the slot generation math.
 *
 * Fallback algorithm:
 *   - Business hours: Mon-Fri only (Sat/Sun skip)
 *   - Istanbul UTC+3 → business 09:00-12:00 + 14:00-17:00
 *   - UTC offset: 09:00 Istanbul = 06:00 UTC
 *   - Slot duration: 30 min
 *   - Hour offsets UTC: [6, 6.5, 7, 7.5, 8, 8.5, 11, 11.5, 12, 12.5, 13, 13.5]
 *   - 12 slots per business day (6 morning + 6 afternoon)
 *
 * Date window math:
 *   Given startDate → endDate, function returns one entry per
 *   business day (Mon-Fri) within the range.
 *
 * Test strategy:
 *   - ISO invariant: all slot times are valid UTC ISO-8601
 *   - Duration: each slot is exactly 30 minutes (1800000 ms)
 *   - Weekday filter: no slots on Sat (dow=6) or Sun (dow=0)
 *   - Count: 12 slots/day for a clean Mon-Fri week
 *   - Boundary: start > end → 0 days → 0 entries
 *   - Single day: works for same-day start+end
 */

import { describe, it, expect } from 'vitest';
import { getAvailableSlots } from './calcom-api';

// ─── Helper ───────────────────────────────────────────────────

function monday(offset = 0): Date {
  const d = new Date('2026-06-01T00:00:00Z'); // Monday June 1 2026
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

// ─── Tests ───────────────────────────────────────────────────

describe('getAvailableSlots (fallback mode — no Cal.com key)', () => {
  it('returns array of SlotsForDay objects', async () => {
    const start = monday(0); // Monday
    const end = monday(4); // Friday
    const result = await getAvailableSlots(start, end);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('each day has date (YYYY-MM-DD) and slots array', async () => {
    const start = monday(0);
    const end = monday(2);
    const result = await getAvailableSlots(start, end);
    for (const day of result) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(day.slots)).toBe(true);
    }
  });

  it('Mon-Fri week (5 days) → exactly 5 day entries', async () => {
    const start = monday(0); // Mon
    const end = monday(4); // Fri
    const result = await getAvailableSlots(start, end);
    expect(result.length).toBe(5);
  });

  it('single Monday → 1 entry', async () => {
    const start = monday(0);
    const end = monday(0);
    const result = await getAvailableSlots(start, end);
    expect(result.length).toBe(1);
  });

  it('Saturday → 0 entries (no weekend slots)', async () => {
    const sat = monday(5); // Monday + 5 = Saturday
    const result = await getAvailableSlots(sat, sat);
    expect(result.length).toBe(0);
  });

  it('Sunday → 0 entries (no weekend slots)', async () => {
    const sun = monday(6); // Monday + 6 = Sunday
    const result = await getAvailableSlots(sun, sun);
    expect(result.length).toBe(0);
  });

  it('Mon-Sun week → exactly 5 entries (Mon-Fri, skip Sat-Sun)', async () => {
    const start = monday(0);
    const end = monday(6); // Sunday
    const result = await getAvailableSlots(start, end);
    expect(result.length).toBe(5);
  });

  it('each business day has exactly 12 slots (6 morning + 6 afternoon)', async () => {
    const start = monday(0);
    const end = monday(0);
    const result = await getAvailableSlots(start, end);
    expect(result[0]!.slots.length).toBe(12);
  });

  it('each slot is exactly 30 minutes duration', async () => {
    const start = monday(0);
    const end = monday(0);
    const result = await getAvailableSlots(start, end);
    for (const slot of result[0]!.slots) {
      const startMs = new Date(slot.start).getTime();
      const endMs = new Date(slot.end).getTime();
      const duration = endMs - startMs;
      expect(duration).toBe(30 * 60 * 1000); // exactly 30 minutes
    }
  });

  it('all slot start times are valid ISO-8601 UTC strings', async () => {
    const start = monday(0);
    const end = monday(2);
    const result = await getAvailableSlots(start, end);
    for (const day of result) {
      for (const slot of day.slots) {
        // Must parse to valid date
        const d = new Date(slot.start);
        expect(isNaN(d.getTime())).toBe(false);
        // Must be UTC (ends with Z)
        expect(slot.start.endsWith('Z')).toBe(true);
        expect(slot.end.endsWith('Z')).toBe(true);
      }
    }
  });

  it('first slot of Monday is 06:00 UTC (= 09:00 Istanbul UTC+3)', async () => {
    const start = monday(0);
    const end = monday(0);
    const result = await getAvailableSlots(start, end);
    const firstSlot = result[0]!.slots[0]!;
    const slotDate = new Date(firstSlot.start);
    expect(slotDate.getUTCHours()).toBe(6);
    expect(slotDate.getUTCMinutes()).toBe(0);
  });

  it('last slot of a day is 13:30 UTC (= 16:30 Istanbul)', async () => {
    const start = monday(0);
    const end = monday(0);
    const result = await getAvailableSlots(start, end);
    const slots = result[0]!.slots;
    const lastSlot = slots[slots.length - 1]!;
    const slotDate = new Date(lastSlot.start);
    expect(slotDate.getUTCHours()).toBe(13);
    expect(slotDate.getUTCMinutes()).toBe(30);
  });

  it('slots are in chronological order (ascending start time)', async () => {
    const start = monday(0);
    const end = monday(0);
    const result = await getAvailableSlots(start, end);
    const slots = result[0]!.slots;
    for (let i = 1; i < slots.length; i++) {
      const prev = new Date(slots[i - 1]!.start).getTime();
      const curr = new Date(slots[i]!.start).getTime();
      expect(curr).toBeGreaterThan(prev);
    }
  });

  it('end before start → 0 entries', async () => {
    const start = monday(5); // Future date
    const end = monday(0); // Past date (before start)
    const result = await getAvailableSlots(start, end);
    expect(result.length).toBe(0);
  });

  it('day objects have no duplicate dates', async () => {
    const start = monday(0);
    const end = monday(10);
    const result = await getAvailableSlots(start, end);
    const dates = result.map((d) => d.date);
    const uniqueDates = new Set(dates);
    expect(uniqueDates.size).toBe(dates.length);
  });
});
