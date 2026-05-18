/**
 * P51.1 — Sentry production error tracking init.
 *
 * VITE_SENTRY_DSN env var dolu ise initialize, boş ise no-op (graceful).
 * Existing src/lib/sentry.ts'i wrap ETMEZ — direkt @sentry/react kullanır
 * (eğer package install edilmişse). Bağımsız modül.
 *
 * Boot order: idle requestIdleCallback ile defer (App.tsx mevcut pattern).
 */

interface SentryAPI {
  init: (config: {
    dsn: string;
    environment?: string;
    tracesSampleRate?: number;
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    integrations?: unknown[];
    beforeSend?: (event: unknown) => unknown;
  }) => void;
  captureException: (e: unknown) => void;
  setUser: (user: { id?: string; email?: string } | null) => void;
  addBreadcrumb: (b: { category: string; message: string; level?: string; data?: unknown }) => void;
}

declare global {
  interface Window {
    __sentryInitialized?: boolean;
    Sentry?: SentryAPI;
  }
}

const DSN = (import.meta.env.VITE_SENTRY_DSN ?? '').trim();
const ENV = (import.meta.env.VITE_SENTRY_ENV ?? 'production').trim();

/**
 * Sentry'yi initialize eder. DSN yoksa no-op.
 * @sentry/react package import'u dinamik (build başarısız olmasın diye).
 */
export async function initSentryIntegration(): Promise<void> {
  if (!DSN || DSN.startsWith('http://placeholder') || DSN.includes('REPLACE')) {
    // No-op when not configured
    return;
  }
  if (typeof window === 'undefined') return;
  if (window.__sentryInitialized) return;

  try {
    // Dynamic import — production build'da bu module sadece DSN varsa execute olur.
    const Sentry = (await import('@sentry/react' as string).catch(() => null)) as unknown as
      | SentryAPI
      | null;
    if (!Sentry || typeof Sentry.init !== 'function') {
      // Sentry package mevcut değil, skip
      // eslint-disable-next-line no-console
      console.warn('[Sentry] @sentry/react not installed; skipping init');
      return;
    }

    Sentry.init({
      dsn: DSN,
      environment: ENV,
      tracesSampleRate: 0.1, // 10% performance traces
      replaysSessionSampleRate: 0.0, // Replay disabled by default (PII concern)
      replaysOnErrorSampleRate: 0.1, // 10% on-error replay
      beforeSend: (event) => {
        // KVKK uyum: PII scrubbing
        if (event && typeof event === 'object') {
          const evt = event as Record<string, unknown> & {
            user?: { email?: string; ip_address?: string };
          };
          if (evt.user) {
            // E-posta hash'le, IP atla
            evt.user.email = evt.user.email ? '[REDACTED]' : undefined;
            evt.user.ip_address = undefined;
          }
        }
        return event;
      },
    });

    window.Sentry = Sentry;
    window.__sentryInitialized = true;

    Sentry.addBreadcrumb({
      category: 'lifecycle',
      message: 'Sentry initialized',
      level: 'info',
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[Sentry] init failed:', err);
  }
}

/** Manual exception capture — safe to call when Sentry not active. */
export function captureException(e: unknown): void {
  if (typeof window === 'undefined') return;
  window.Sentry?.captureException?.(e);
}

/** Route change breadcrumb — call from RouterDependentHooks. */
export function trackRouteChange(pathname: string): void {
  if (typeof window === 'undefined') return;
  window.Sentry?.addBreadcrumb?.({
    category: 'navigation',
    message: `Route → ${pathname}`,
    level: 'info',
    data: { pathname },
  });
}

/** Identify user (post-login). */
export function identifyUser(user: { id?: string; email?: string } | null): void {
  if (typeof window === 'undefined') return;
  window.Sentry?.setUser?.(user);
}
