/**
 * LiveChat — Phase 20 B1
 *
 * Feature-flagged, KVKK-compliant live chat slot.
 *
 * Behavior:
 *   - Provider is selected via `VITE_LIVECHAT_PROVIDER` (`crisp` | `tawk` | `intercom`).
 *   - Provider id is read from `VITE_LIVECHAT_ID` (and `VITE_LIVECHAT_TAWK_WIDGET_ID`
 *     for tawk.to which needs both property and widget ids).
 *   - If either env is missing OR consent is not granted, NOTHING is rendered;
 *     no third-party script is shipped, SEO/perf untouched.
 *   - Consent state is persisted in localStorage (`ecypro-livechat-consent`).
 *   - All scripts are loaded with `async` + `defer` and tracked so they can be
 *     removed when the user revokes consent.
 *
 * Usage: mount once near the top of `App.tsx`.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Provider = 'crisp' | 'tawk' | 'intercom';

interface ChatConfig {
  provider: Provider;
  id: string;
  /** tawk.to also needs a widget id; everyone else uses just `id`. */
  tawkWidgetId?: string;
}

const CONSENT_STORAGE_KEY = 'ecypro-livechat-consent';
const SCRIPT_DATA_ATTR = 'data-ecypro-livechat';

function readEnvConfig(): ChatConfig | null {
  // Vite exposes only `VITE_*` envs; everything else stays server-side.
  const provider = (import.meta.env.VITE_LIVECHAT_PROVIDER ?? '').toLowerCase() as Provider | '';
  const id = (import.meta.env.VITE_LIVECHAT_ID ?? '').toString();
  const tawkWidgetId = (import.meta.env.VITE_LIVECHAT_TAWK_WIDGET_ID ?? '').toString();

  if (!id || !['crisp', 'tawk', 'intercom'].includes(provider)) return null;
  if (provider === 'tawk' && !tawkWidgetId) return null;

  return {
    provider: provider as Provider,
    id,
    tawkWidgetId: provider === 'tawk' ? tawkWidgetId : undefined,
  };
}

function readConsent(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(CONSENT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeConsent(value: boolean): void {
  try {
    if (value) window.localStorage.setItem(CONSENT_STORAGE_KEY, '1');
    else window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* ignore quota / disabled storage */
  }
}

function loadProvider(config: ChatConfig): () => void {
  // Returns a cleanup function that removes the injected script(s).
  const cleanups: Array<() => void> = [];

  if (config.provider === 'crisp') {
    const w = window as unknown as { $crisp?: unknown[]; CRISP_WEBSITE_ID?: string };
    w.$crisp = [];
    w.CRISP_WEBSITE_ID = config.id;
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    script.setAttribute(SCRIPT_DATA_ATTR, 'crisp');
    document.head.appendChild(script);
    cleanups.push(() => script.remove());
  } else if (config.provider === 'tawk') {
    const w = window as unknown as { Tawk_API?: object; Tawk_LoadStart?: Date };
    w.Tawk_API = w.Tawk_API ?? {};
    w.Tawk_LoadStart = new Date();
    const script = document.createElement('script');
    script.src = `https://embed.tawk.to/${config.id}/${config.tawkWidgetId}`;
    script.async = true;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    script.setAttribute(SCRIPT_DATA_ATTR, 'tawk');
    document.head.appendChild(script);
    cleanups.push(() => script.remove());
  } else if (config.provider === 'intercom') {
    const w = window as unknown as { intercomSettings?: { app_id: string } };
    w.intercomSettings = { app_id: config.id };
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://widget.intercom.io/widget/${config.id}`;
    script.setAttribute(SCRIPT_DATA_ATTR, 'intercom');
    document.head.appendChild(script);
    cleanups.push(() => script.remove());
  }

  return () => cleanups.forEach((fn) => fn());
}

/** Fallback strings used when react-i18next hasn't loaded yet. */
const DEFAULT_LABELS = {
  title: 'Canlı destek',
  description:
    'Sorularınızı anlık olarak yanıtlamak için üçüncü taraf bir canlı sohbet hizmeti yükleyebiliriz. Onaylamadan hiçbir betik yüklenmez.',
  accept: 'Onaylıyorum',
  decline: 'Hayır, teşekkürler',
  revoke: 'Onayı geri al',
};

export default function LiveChat() {
  const { t } = useTranslation('liveChat');
  const config = useMemo(readEnvConfig, []);
  const [consent, setConsent] = useState<boolean>(() => readConsent());
  const [dismissed, setDismissed] = useState<boolean>(false);

  // Inject / remove provider scripts whenever consent toggles.
  useEffect(() => {
    if (!config) return;
    if (!consent) return;
    const cleanup = loadProvider(config);
    return cleanup;
  }, [config, consent]);

  // No provider configured → render nothing (zero shipping cost).
  if (!config) return null;

  // i18n falls back to the raw key while resources load → use defaults instead.
  const L = {
    title: t('title', DEFAULT_LABELS.title),
    description: t('description', DEFAULT_LABELS.description),
    accept: t('accept', DEFAULT_LABELS.accept),
    decline: t('decline', DEFAULT_LABELS.decline),
    revoke: t('revoke', DEFAULT_LABELS.revoke),
  };

  // Consent already given: small revoke pill (low-prominence).
  if (consent) {
    return (
      <button
        type="button"
        onClick={() => {
          writeConsent(false);
          setConsent(false);
        }}
        className="fixed bottom-3 left-3 z-50 rounded-full bg-neutral-900/70 px-3 py-1 text-xs text-white/80 hover:bg-neutral-900"
        aria-label={L.revoke}
      >
        {L.revoke}
      </button>
    );
  }

  // User dismissed without consenting (or first-load and they hit decline).
  if (dismissed) return null;

  // Consent banner (KVKK / GDPR friendly).
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={L.title}
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-white/10 bg-neutral-900/95 p-4 text-sm text-white shadow-2xl"
    >
      <p className="mb-2 font-semibold">{L.title}</p>
      <p className="mb-3 text-white/75">{L.description}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-md border border-white/20 px-3 py-1 text-xs text-white/80 hover:bg-white/5"
        >
          {L.decline}
        </button>
        <button
          type="button"
          onClick={() => {
            writeConsent(true);
            setConsent(true);
          }}
          className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-neutral-900 hover:bg-amber-400"
        >
          {L.accept}
        </button>
      </div>
    </div>
  );
}
