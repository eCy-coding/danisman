/**
 * P37-T03: ICS Calendar File Generator — RFC 5545
 *
 * Generates `.ics` file content compatible with:
 *   - Google Calendar (import + "Add to Calendar" link)
 *   - Apple Calendar (iCal)
 *   - Microsoft Outlook
 *   - Any RFC 5545 compliant client
 *
 * Uses the `ics` npm package for spec-compliant generation.
 *
 * Also provides:
 *   - `googleCalendarUrl()` — direct deep-link to Google Calendar new event
 *   - `outlookCalendarUrl()` — direct deep-link to Outlook calendar
 */

import { createEvent, EventAttributes } from 'ics';

export interface CalendarEventInput {
  uid: string;
  title: string;
  description?: string;
  startDate: Date;
  durationMinutes: number;
  location?: string;
  organizerEmail: string;
  organizerName: string;
  attendeeEmail: string;
  attendeeName: string;
  meetingUrl?: string;
}

function dateToIcsArray(date: Date): [number, number, number, number, number] {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ];
}

/**
 * Generate RFC 5545 ICS string for a booking.
 * Returns the ICS content string or null on error.
 */
export function generateICS(input: CalendarEventInput): string | null {
  const description = [
    input.description ?? 'EcyPro Premium Consulting — Stratejik Danışmanlık Görüşmesi',
    input.meetingUrl ? `\nGörüşme linki: ${input.meetingUrl}` : '',
    '\nEcyPro Premium Consulting | https://ecypro.com',
  ].join('');

  const event: EventAttributes = {
    uid: `${input.uid}@ecypro.com`,
    title: input.title,
    description,
    start: dateToIcsArray(input.startDate),
    startInputType: 'utc',
    duration: { minutes: input.durationMinutes },
    location: input.location ?? input.meetingUrl ?? 'Online',
    url: input.meetingUrl,
    organizer: { name: input.organizerName, email: input.organizerEmail },
    attendees: [
      {
        name: input.attendeeName,
        email: input.attendeeEmail,
        rsvp: true,
        partstat: 'ACCEPTED',
        role: 'REQ-PARTICIPANT',
      },
      {
        name: input.organizerName,
        email: input.organizerEmail,
        partstat: 'ACCEPTED',
        role: 'CHAIR',
      },
    ],
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    alarms: [
      {
        action: 'display',
        description: '1 gün önce hatırlatıcı',
        trigger: { hours: 24, before: true },
      },
      {
        action: 'display',
        description: '1 saat önce hatırlatıcı',
        trigger: { hours: 1, before: true },
      },
    ],
  };

  const { value, error } = createEvent(event);
  if (error) return null;
  return value ?? null;
}

/**
 * Generate a "Add to Google Calendar" direct link.
 * Timezone: UTC (Google converts automatically to user's timezone).
 */
export function googleCalendarUrl(input: CalendarEventInput): string {
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const end = new Date(input.startDate.getTime() + input.durationMinutes * 60_000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${fmt(input.startDate)}Z/${fmt(end)}Z`,
    details: input.description ?? 'EcyPro Stratejik Danışmanlık Görüşmesi',
    location: input.meetingUrl ?? 'Online',
    add: input.attendeeEmail,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Microsoft Outlook Web "Add to Calendar" link.
 */
export function outlookCalendarUrl(input: CalendarEventInput): string {
  const end = new Date(input.startDate.getTime() + input.durationMinutes * 60_000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: input.title,
    startdt: input.startDate.toISOString(),
    enddt: end.toISOString(),
    body: input.description ?? 'EcyPro Stratejik Danışmanlık Görüşmesi',
    location: input.meetingUrl ?? 'Online',
  });

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}
