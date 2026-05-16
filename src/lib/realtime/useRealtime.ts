/**
 * P23/T1 — `useRealtime` React hook.
 *
 *   const { events, status, lastEvent } = useRealtime('blog-comments');
 *
 * Topic'e abone olur, mesajları lokal state'te biriktirir (last N), bağlantı
 * durumunu yayar. Singleton `SSEClient` üzerinden multiplex çalışır — N hook
 * çağrısı tek bağlantı.
 *
 * Bellek güvenliği: default kapasite 50, taşma FIFO drop.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getDefaultSSEClient,
  type SSEClient,
  type SSEMessage,
  type SSEStatus,
} from './sse-client';

export interface UseRealtimeOptions {
  /** Custom client (test/mock) — verilmezse singleton kullanılır. */
  client?: SSEClient;
  /** Saklanacak son N mesaj. Default 50. */
  bufferSize?: number;
  /** Topic'e abone olma (filtrelenir); verilmezse tüm topic'ler. */
  topic?: string;
}

export interface UseRealtimeResult<T = unknown> {
  events: ReadonlyArray<SSEMessage<T>>;
  lastEvent: SSEMessage<T> | null;
  status: SSEStatus;
  clear: () => void;
}

export function useRealtime<T = unknown>(
  topic?: string,
  options: UseRealtimeOptions = {},
): UseRealtimeResult<T> {
  const bufferSize = Math.max(1, options.bufferSize ?? 50);
  const client = options.client ?? getDefaultSSEClient();
  const [events, setEvents] = useState<SSEMessage<T>[]>([]);
  const [status, setStatus] = useState<SSEStatus>(client.getStatus());
  const bufferRef = useRef<SSEMessage<T>[]>([]);

  // Stabilize callback ref'leri
  const optTopic = options.topic ?? topic;

  useEffect(() => {
    bufferRef.current = [];
    setEvents([]);

    const handler = (msg: SSEMessage): void => {
      if (optTopic && msg.topic && msg.topic !== optTopic) return;
      bufferRef.current = [...bufferRef.current.slice(-(bufferSize - 1)), msg as SSEMessage<T>];
      setEvents(bufferRef.current);
    };

    const off = optTopic ? client.on(optTopic, handler) : client.onAny(handler);
    const offStatus = client.onStatus(setStatus);

    return () => {
      off();
      offStatus();
    };
  }, [client, optTopic, bufferSize]);

  const clear = useMemo(
    () => () => {
      bufferRef.current = [];
      setEvents([]);
    },
    [],
  );

  const lastEvent = events.length > 0 ? events[events.length - 1]! : null;
  return { events, lastEvent, status, clear };
}
