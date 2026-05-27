import { useEffect, useRef } from 'react';

interface NewCandidatePayload {
  name: string;
  company: string;
  id: string;
}

interface UseNewLeadNotificationsOptions {
  onNewLead: (payload: NewCandidatePayload) => void;
}

const MAX_RECONNECT_DELAY_MS = 30_000;

export function useNewLeadNotifications({ onNewLead }: UseNewLeadNotificationsOptions) {
  const onNewLeadRef = useRef(onNewLead);
  onNewLeadRef.current = onNewLead;

  useEffect(() => {
    let es: EventSource;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      es = new EventSource('/api/admin/events');

      const handler = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data as string) as {
            type: string;
            data: NewCandidatePayload;
          };
          if (parsed.type === 'new_candidate') {
            onNewLeadRef.current(parsed.data);
          }
        } catch {
          // malformed message — ignore
        }
      };

      es.addEventListener('message', handler);

      es.onerror = () => {
        es.removeEventListener('message', handler);
        es.close();
        if (cancelled) return;
        // exponential backoff: 1s → 2s → 4s → … → 30s max
        const delay = Math.min(1_000 * Math.pow(2, attempt), MAX_RECONNECT_DELAY_MS);
        attempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, []);
}
