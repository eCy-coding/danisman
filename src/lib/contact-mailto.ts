/**
 * P34 — Static-only emergency fallback for ContactForm.
 *
 * Backend (Telegram bot, Render API) credentials YOK iken kullanıcı yine de
 * kontak kurabilmeli. Bu modül, `VITE_API_URL` boş ve `VITE_TELEGRAM_BOT_TOKEN`
 * yoksa client-side mailto: deeplink üretir.
 *
 * Wire-up (opsiyonel):
 *   import { isStaticOnlyMode, openMailtoFallback } from '@/lib/contact-mailto';
 *   if (isStaticOnlyMode()) openMailtoFallback(data);
 *
 * Bu modül DOM'a dokunmaz; çağıran component karar verir. Test edilebilir
 * fonksiyonlar saf (pure) — `buildMailtoUrl` deterministic.
 */

import { Logger } from './logger';

const FALLBACK_TO = 'hello@ecypro.com';

export interface MailtoPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

/**
 * Static-only mode: hem backend hem Telegram bot tokens boş.
 * Production build'de `import.meta.env` Vite tarafından inline edilir; bu
 * yüzden runtime'da check ucuz (string compare).
 */
export function isStaticOnlyMode(): boolean {
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  const tgBot = (import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string | undefined) ?? '';
  return apiUrl.trim().length === 0 && tgBot.trim().length === 0;
}

/**
 * RFC 6068 uyumlu mailto: URL kurar. Subject + body encode edilir.
 * Pure function — yan etkisi yok; test edilebilir.
 */
export function buildMailtoUrl(payload: MailtoPayload, to: string = FALLBACK_TO): string {
  const subject = payload.subject?.trim() || 'eCyPro kontak formu';
  const lines = [
    `Ad Soyad: ${payload.name}`,
    `E-posta: ${payload.email}`,
    payload.subject ? `Konu: ${payload.subject}` : null,
    '',
    payload.message,
    '',
    '---',
    'Bu mesaj ecypro.com kontak formundan iletildi (static-only fallback).',
  ].filter((l): l is string => l !== null);
  const body = lines.join('\n');
  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body);
  // URLSearchParams `+` üretir; mailto: spec `%20` ister.
  const qs = params.toString().replace(/\+/g, '%20');
  return `mailto:${to}?${qs}`;
}

/**
 * Tarayıcıyı mailto: hedefine yönlendirir. SSR güvenli (no-op server-side).
 * Çağıran component, isStaticOnlyMode() döndüğünde tetikler.
 */
export function openMailtoFallback(payload: MailtoPayload, to: string = FALLBACK_TO): void {
  if (typeof window === 'undefined') return;
  const url = buildMailtoUrl(payload, to);
  Logger.info('[contact-mailto] static-only fallback fired', { to });
  // `assign` history'e push eder; `location.href = ...` aynı etkide ama
  // assign daha okunaklı.
  window.location.assign(url);
}
