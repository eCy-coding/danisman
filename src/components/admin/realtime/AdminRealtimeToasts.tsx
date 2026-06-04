/**
 * R7-P2.2 — Admin Real-time Toasts.
 *
 * Single EventSource subscription mounted at the AdminLayout level. Bridges
 * the 5-channel `adminEventBus` SSE wire to in-page toasts so admins get
 * immediate feedback as activity happens elsewhere in the app:
 *
 *   contact_new           → "Yeni iletişim formu: <name> · <company>"
 *   lead_new              → "Yeni Aday: <name> · <company>"
 *   lead_updated          → "Aday güncellendi"
 *   newsletter_subscribed → "Yeni abone: <email>"
 *   campaign_sent         → "Kampanya gönderildi: <subject> (<recipients>)"
 *   audit_action          → silent (already on audit feed)
 *
 * Auth: query-token (matches server/middleware/auth.ts R3 fallback). Reads the
 * persisted Zustand token on mount; falls back to polling-free silent mode if
 * absent (login screen, refresh in-flight, etc.).
 *
 * Backoff: 2s → 4s → 8s exponential, capped at 30s. Resets to 2s on a clean
 * 'open' frame. EventSource itself auto-reconnects on transport drop, but if
 * we get an error event we close + manually reopen so token rotation works.
 */
import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const SSE_URL_BASE = (() => {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const base = env?.VITE_API_URL ?? 'http://localhost:3001/api';
  return `${base}/admin/analytics-stream`;
})();

interface PersistedAuth {
  state?: { token?: string };
}

function readToken(): string | undefined {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    const raw = window.localStorage.getItem('ecypro-app-storage');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PersistedAuth;
    return parsed?.state?.token;
  } catch {
    return undefined;
  }
}

function safeJson<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const AdminRealtimeToasts: React.FC = () => {
  const esRef = useRef<EventSource | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(2000);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const connect = () => {
      if (!mountedRef.current) return;
      const token = readToken();
      if (!token) {
        // Not authenticated yet — try again after backoff. Avoids burning
        // an SSE limit slot on login screen.
        retryTimer.current = setTimeout(connect, backoffRef.current);
        backoffRef.current = Math.min(backoffRef.current * 2, 30_000);
        return;
      }

      // Close any prior connection (token rotation, HMR replace, etc.)
      esRef.current?.close();

      const url = `${SSE_URL_BASE}?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener('open', () => {
        backoffRef.current = 2000; // reset
      });

      es.addEventListener('error', () => {
        if (!mountedRef.current) return;
        es.close();
        retryTimer.current = setTimeout(connect, backoffRef.current);
        backoffRef.current = Math.min(backoffRef.current * 2, 30_000);
      });

      // ── Channel: contact_new ────────────────────────────────
      es.addEventListener('contact_new', (e: MessageEvent) => {
        const data = safeJson<{ fullName?: string; company?: string; service?: string | null }>(
          e.data as string,
        );
        if (!data) return;
        toast.message('Yeni iletişim formu', {
          description: `${data.fullName ?? '(isimsiz)'}${data.company ? ' · ' + data.company : ''}${
            data.service ? ' · ' + data.service : ''
          }`,
        });
      });

      // ── Channel: lead_new ───────────────────────────────────
      es.addEventListener('lead_new', (e: MessageEvent) => {
        const data = safeJson<{ name?: string; company?: string }>(e.data as string);
        if (!data) return;
        toast.success('Yeni Aday eklendi', {
          description: `${data.name ?? '(isimsiz)'}${data.company ? ' · ' + data.company : ''}`,
        });
      });

      // ── Channel: lead_updated ───────────────────────────────
      es.addEventListener('lead_updated', (e: MessageEvent) => {
        const data = safeJson<{ id?: string; status?: string }>(e.data as string);
        if (!data) return;
        toast.message('Aday güncellendi', {
          description: data.status ? `Durum: ${data.status}` : undefined,
        });
      });

      // ── Channel: newsletter_subscribed ──────────────────────
      es.addEventListener('newsletter_subscribed', (e: MessageEvent) => {
        const data = safeJson<{ email?: string; source?: string | null }>(e.data as string);
        if (!data?.email) return;
        toast.message('Yeni abone', {
          description: data.source ? `${data.email} · ${data.source}` : data.email,
        });
      });

      // ── Channel: campaign_sent ──────────────────────────────
      es.addEventListener('campaign_sent', (e: MessageEvent) => {
        const data = safeJson<{
          subject?: string;
          recipientCount?: number;
          enrolled?: number;
        }>(e.data as string);
        if (!data) return;
        toast.success('Kampanya kuyruğa alındı', {
          description: `${data.subject ?? '(başlıksız)'} · ${data.recipientCount ?? 0} alıcı`,
        });
      });

      // audit_action intentionally silent — admins don't want a toast for
      // their own clicks; the dedicated /admin/audit-log feed shows it.
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, []);

  // Pure side-effect component — no UI of its own. Toasts render via the
  // <Toaster /> already mounted by sonner provider higher in the tree.
  return null;
};

export default AdminRealtimeToasts;
