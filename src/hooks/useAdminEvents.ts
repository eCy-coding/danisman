/**
 * P61.B4 — Admin SSE EventSource hook.
 *
 * Subscribes to `/api/admin/events` Server-Sent Events; dispatches typed events
 * to optional callback. Reconnects with exponential backoff.
 */

import { useEffect, useRef } from 'react';

export type AdminEventType =
  | 'lead.created'
  | 'lead.updated'
  | 'contact.submitted'
  | 'newsletter.subscribed'
  | 'campaign.sent'
  | 'audit.action'
  | 'ready';

export interface AdminEvent {
  type: AdminEventType;
  ts: number;
  payload: Record<string, unknown>;
}

interface Options {
  enabled?: boolean;
  onEvent?: (evt: AdminEvent) => void;
}

export function useAdminEvents({ enabled = true, onEvent }: Options = {}): void {
  const sourceRef = useRef<EventSource | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
    const url = `${baseURL}/admin/events`;

    const connect = () => {
      if (cancelled) return;
      const es = new EventSource(url, { withCredentials: true });
      sourceRef.current = es;

      const types: AdminEventType[] = [
        'lead.created',
        'lead.updated',
        'contact.submitted',
        'newsletter.subscribed',
        'campaign.sent',
        'audit.action',
        'ready',
      ];
      for (const t of types) {
        es.addEventListener(t, (ev: MessageEvent) => {
          try {
            const parsed = JSON.parse(ev.data) as AdminEvent;
            onEvent?.(parsed);
          } catch {
            /* ignore malformed */
          }
        });
      }

      es.onopen = () => {
        attemptsRef.current = 0;
      };
      es.onerror = () => {
        es.close();
        if (cancelled) return;
        const backoff = Math.min(30_000, 1000 * Math.pow(2, attemptsRef.current));
        attemptsRef.current += 1;
        window.setTimeout(connect, backoff);
      };
    };

    connect();

    return () => {
      cancelled = true;
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [enabled, onEvent]);
}

export default useAdminEvents;
