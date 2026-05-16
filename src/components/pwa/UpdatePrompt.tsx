/**
 * P16 — PWA Update Prompt
 *
 * `vite-plugin-pwa` `registerType: 'prompt'` modunda yeni SW kayıtlı ama
 * `waiting` durumunda kalır. Bu toast kullanıcıya kibarca bildirir, kabul edince:
 *   1. `updateServiceWorker(true)` → waiting SW'a `SKIP_WAITING` mesajı gönderir.
 *   2. SW activate → `clientsClaim` ile tüm sayfaları üstlenir.
 *   3. Browser otomatik reload eder (true parametresi).
 *
 * UX:
 *   - role="status" + aria-live=polite — sessizce duyurulur, focus çalmaz.
 *   - Dismiss → `pwa-update-dismissed-<version>` localStorage'a yazılır;
 *     aynı SW hash'i için tekrar gösterilmez (sonraki gerçek update'te yeniden).
 *   - i18n: TR/EN.
 *
 * Mount edildiği yer: `MainLayout` (InstallPrompt ile aynı klasör).
 */

import React, { useCallback, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from '../../lib/i18n';
import { Logger } from '../../lib/logger';

const DISMISS_KEY = 'pwa-update-dismissed-version';

function readDismissed(): string | null {
  try {
    return localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

function writeDismissed(token: string): void {
  try {
    localStorage.setItem(DISMISS_KEY, token);
  } catch {
    /* localStorage disabled — silent */
  }
}

export const UpdatePrompt: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('en') ? 'en' : 'tr') as 'tr' | 'en';

  // Stable token per *session of new SW availability*. SW version itself isn't
  // exposed by useRegisterSW; we approximate "this prompt instance" with a
  // mount-time timestamp. Real version skew is detected by browser on next visit.
  const [dismissToken] = useState<string>(() => `t-${Date.now()}`);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed() === dismissToken);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, reg) {
      // Periodically poll for a new SW (every 60 min). This catches deployments
      // for sessions where the user keeps the tab open without reloading.
      if (reg) {
        setInterval(() => {
          reg.update().catch(() => undefined);
        }, 60 * 60 * 1000);
      }
      Logger.info?.(`[pwa] SW registered: ${swUrl}`);
    },
    onRegisterError(err) {
      Logger.warn('[pwa] SW register failed', err as Error);
    },
  });

  const visible = needRefresh && !dismissed;

  const onUpdate = useCallback(async () => {
    setBusy(true);
    try {
      await updateServiceWorker(true);
    } catch (err) {
      Logger.warn('[pwa] update failed', err as Error);
      setBusy(false);
    }
    // No re-enable; browser reloads at end of updateServiceWorker(true).
  }, [updateServiceWorker]);

  const onDismiss = useCallback(() => {
    writeDismissed(dismissToken);
    setDismissed(true);
    setNeedRefresh(false);
  }, [dismissToken, setNeedRefresh]);

  if (!visible) return null;

  const copy = {
    title: lang === 'tr' ? 'Yeni sürüm hazır' : 'New version available',
    body:
      lang === 'tr'
        ? 'Daha iyi performans ve hatasız çalışma için sayfayı yeniden yüklemenizi öneririz.'
        : 'Reload the page to get the latest improvements and bug fixes.',
    accept: lang === 'tr' ? 'Şimdi yenile' : 'Reload now',
    later: lang === 'tr' ? 'Daha sonra' : 'Later',
    dismissAria: lang === 'tr' ? 'Güncelleme bildirimini kapat' : 'Dismiss update notice',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-labelledby="pwa-update-title"
      aria-describedby="pwa-update-body"
      className="fixed bottom-fib-6 left-fib-6 z-50 max-w-sm bg-surface-1 border border-secondary/30 rounded-lg shadow-2xl p-fib-5 animate-in slide-in-from-bottom-3"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label={copy.dismissAria}
        className="absolute top-fib-3 right-fib-3 text-slate-400 hover:text-white transition-colors p-1"
      >
        <X size={18} aria-hidden="true" />
      </button>

      <div className="flex items-start gap-fib-4">
        <div className="shrink-0 w-12 h-12 rounded-md bg-secondary/15 text-secondary flex items-center justify-center">
          <RefreshCw size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 id="pwa-update-title" className="text-base font-semibold text-white mb-fib-2">
            {copy.title}
          </h3>
          <p id="pwa-update-body" className="text-sm text-slate-300 mb-fib-4">
            {copy.body}
          </p>
          <div className="flex gap-fib-3">
            <button
              type="button"
              onClick={onUpdate}
              disabled={busy}
              className="inline-flex items-center gap-fib-2 px-fib-5 py-fib-2 bg-secondary text-neutral text-sm font-semibold rounded-md transition active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              {copy.accept}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-fib-4 py-fib-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              {copy.later}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
