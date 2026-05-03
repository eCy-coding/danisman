import { useEffect, useRef, useCallback, useState } from 'react';

// ─── SSE Event Types ─────────────────────────────────────
export interface SSEEvent {
  type: string;
  timestamp: number;
  data?: unknown;
}

export interface DashboardMetrics {
  totalPageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  conversionRate: number;
}

interface UseSSEOptions {
  url?: string;
  autoReconnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onEvent?: (event: SSEEvent) => void;
  onMetrics?: (metrics: DashboardMetrics) => void;
}

// ─── SSE Hook ────────────────────────────────────────────
export function useSSE({
  url,
  autoReconnect = true,
  maxRetries = 5,
  retryDelay = 3000,
  onEvent,
  onMetrics,
}: UseSSEOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  const sseUrl = url || `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/sse/dashboard`;

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      retriesRef.current = 0;
    };

    // Generic message handler
    es.onmessage = (event) => {
      try {
        const parsed: SSEEvent = JSON.parse(event.data);
        setLastEvent(parsed);
        onEvent?.(parsed);
      } catch {
        // Non-JSON heartbeats — ignore
      }
    };

    // Dashboard metrics event
    es.addEventListener('dashboard', (event) => {
      try {
        const metrics: DashboardMetrics = JSON.parse((event as MessageEvent).data);
        onMetrics?.(metrics);
      } catch {
        // ignore parse errors
      }
    });

    // Personalization event
    es.addEventListener('personalize', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onEvent?.({ type: 'personalize', timestamp: Date.now(), data });
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      setIsConnected(false);
      es.close();

      if (autoReconnect && retriesRef.current < maxRetries) {
        retriesRef.current += 1;
        const delay = retryDelay * Math.pow(2, retriesRef.current - 1); // Exponential backoff
        setTimeout(connect, delay);
      }
    };
  }, [sseUrl, autoReconnect, maxRetries, retryDelay, onEvent, onMetrics]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    reconnect: connect,
    disconnect,
  };
}
