/**
 * P34 — Sentry noop adapter (static-only emergency mode).
 *
 * `VITE_SENTRY_DSN` boş ise uncaught error'ları console.error'a düşürür ve
 * `Sentry.captureException` çağrılarını swallowlar. Production'da silent.
 *
 * Kullanım:
 *   import { captureExceptionSafe, setupGlobalErrorHandlerSafe } from '@/lib/sentry-noop';
 *   try { ... } catch (err) { captureExceptionSafe(err); }
 *
 * Gerçek Sentry init (`@sentry/react`) `main.tsx`'de yapılır; bu modül onun
 * fallback'i. Çağıran tarafta env check:
 *   const dsn = import.meta.env.VITE_SENTRY_DSN;
 *   if (dsn) Sentry.captureException(err) else captureExceptionSafe(err);
 */

import { Logger } from './logger';

type SerializableContext = Record<string, unknown>;

let installed = false;

/**
 * Sentry yüklenip yüklenmediğini sorgu.
 */
export function isSentryDisabled(): boolean {
  const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined) ?? '';
  return dsn.trim().length === 0;
}

/**
 * Sentry olmadan exception swallow. Console.error'a düşürür.
 * Production'da görünür; dev'de zaten React DevTools yakalar.
 */
export function captureExceptionSafe(error: unknown, context?: SerializableContext): void {
  if (typeof window === 'undefined') return;
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  Logger.error('[sentry-noop] captured exception', {
    message: msg,
    stack: stack?.split('\n').slice(0, 5).join('\n'),
    ...(context ?? {}),
  });
}

/**
 * Sentry olmadan info/breadcrumb. Console.info.
 */
export function captureMessageSafe(message: string, context?: SerializableContext): void {
  if (typeof window === 'undefined') return;
  Logger.info('[sentry-noop] message', { message, ...(context ?? {}) });
}

/**
 * Global error + unhandledrejection handler. Sentry yokken bile kritik
 * hataları console + (varsa) backend log endpoint'ine düşürür.
 * Idempotent — tekrar çağrıldığında re-attach etmez.
 */
export function setupGlobalErrorHandlerSafe(): void {
  if (typeof window === 'undefined' || installed) return;
  installed = true;
  window.addEventListener('error', (evt) => {
    captureExceptionSafe(evt.error ?? evt.message, {
      filename: evt.filename,
      lineno: evt.lineno,
      colno: evt.colno,
    });
  });
  window.addEventListener('unhandledrejection', (evt) => {
    captureExceptionSafe(evt.reason ?? 'unhandledrejection', { type: 'unhandledrejection' });
  });
  Logger.info('[sentry-noop] global error handler installed');
}
