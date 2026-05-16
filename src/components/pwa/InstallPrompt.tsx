/**
 * P13/4 — Smart PWA Install Prompt.
 *
 * Davranış:
 *   - `beforeinstallprompt` event'i yakalanır (Chromium-only API).
 *   - Prompt timing: 3+ pageview VEYA 2+ dakika engagement → tetik.
 *     Web ekranı açıldığında hemen banner basmak conversion'u %60+ düşürür;
 *     Google Chrome dev rapor.
 *   - Dismiss → `pwa-install-dismissed-<v>` localStorage'a yazılır → 7 gün
 *     boyunca tekrar gösterilmez.
 *   - Install accepted → tracking event + state clear.
 *
 * Görünür değil: iOS Safari (beforeinstallprompt yok), Firefox masaüstü,
 * zaten install edilmiş, kullanıcı dismiss etmiş. UX fail-soft.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

const STORAGE_VERSION = 'v2';
const DISMISS_KEY = `pwa-install-dismissed-${STORAGE_VERSION}`;
const PAGEVIEW_KEY = 'pwa-install-pageview-count';
const FIRST_VIEW_KEY = 'pwa-install-first-view-ts';

const ENGAGEMENT_MIN_PAGEVIEWS = 3;
const ENGAGEMENT_MIN_MS = 120_000; // 2 minutes
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt: () => Promise<void>;
}

function shouldShowYet(): boolean {
  try {
    // Recently dismissed?
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const ts = Number.parseInt(dismissed, 10);
      if (!Number.isNaN(ts) && Date.now() - ts < DISMISS_COOLDOWN_MS) return false;
    }
    // Engagement criteria
    const count = Number.parseInt(localStorage.getItem(PAGEVIEW_KEY) ?? '0', 10) || 0;
    const firstView = Number.parseInt(localStorage.getItem(FIRST_VIEW_KEY) ?? '0', 10) || Date.now();
    const elapsed = Date.now() - firstView;
    return count >= ENGAGEMENT_MIN_PAGEVIEWS || elapsed >= ENGAGEMENT_MIN_MS;
  } catch {
    return false;
  }
}

function bumpPageviewCount(): void {
  try {
    const prev = Number.parseInt(localStorage.getItem(PAGEVIEW_KEY) ?? '0', 10) || 0;
    localStorage.setItem(PAGEVIEW_KEY, String(prev + 1));
    if (!localStorage.getItem(FIRST_VIEW_KEY)) {
      localStorage.setItem(FIRST_VIEW_KEY, String(Date.now()));
    }
  } catch {
    /* localStorage might be disabled — silently skip */
  }
}

export const InstallPrompt: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('en') ? 'en' : 'tr') as 'tr' | 'en';

  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  // Bump pageview count once on mount.
  useEffect(() => {
    bumpPageviewCount();
  }, []);

  // Listen for browser's install prompt.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      e.preventDefault(); // we control timing
      setEvent(e as BeforeInstallPromptEvent);
      if (shouldShowYet()) {
        setVisible(true);
      } else {
        // Re-check periodically while user engages with site
        const id = window.setInterval(() => {
          if (shouldShowYet()) {
            setVisible(true);
            window.clearInterval(id);
          }
        }, 30_000);
        // Cleanup if user closes tab — interval auto-collects.
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setVisible(false);
      setEvent(null);
    });
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const onInstall = useCallback(async () => {
    if (!event) return;
    setBusy(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
          'event',
          'pwa_install_prompt',
          { outcome: choice.outcome, source: 'engagement' },
        );
      }
      if (choice.outcome === 'dismissed') {
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
      }
    } catch {
      // user cancelled or browser refused — soft fail
    } finally {
      setBusy(false);
      setVisible(false);
      setEvent(null);
    }
  }, [event]);

  const onDismiss = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
        'event',
        'pwa_install_dismiss',
        { source: 'engagement' },
      );
    }
    setVisible(false);
  }, []);

  if (!visible || !event) return null;

  const copy = {
    title: lang === 'tr' ? 'EcyPro\'yu yükle' : 'Install EcyPro',
    body:
      lang === 'tr'
        ? 'Daha hızlı erişim ve çevrimdışı destek için ana ekrana ekleyin.'
        : 'Add to home screen for faster access and offline support.',
    install: lang === 'tr' ? 'Yükle' : 'Install',
    later: lang === 'tr' ? 'Daha sonra' : 'Not now',
    dismissAria: lang === 'tr' ? 'Yükleme isteğini kapat' : 'Dismiss install prompt',
  };

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-body"
      className="fixed bottom-fib-6 right-fib-6 z-40 max-w-sm bg-surface-1 border border-white/10 rounded-lg shadow-2xl p-fib-5 animate-in slide-in-from-bottom-3"
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
          <Download size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 id="pwa-install-title" className="text-base font-semibold text-white mb-fib-2">
            {copy.title}
          </h3>
          <p id="pwa-install-body" className="text-sm text-slate-300 mb-fib-4">
            {copy.body}
          </p>
          <div className="flex gap-fib-3">
            <button
              type="button"
              onClick={onInstall}
              disabled={busy}
              className="inline-flex items-center gap-fib-2 px-fib-5 py-fib-2 bg-secondary text-neutral text-sm font-semibold rounded-md transition active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              {copy.install}
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

export default InstallPrompt;
