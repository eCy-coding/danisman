/**
 * CookiePage — Cookie Policy page.
 * atom-14-1: Cookie policy body
 * atom-14-2: Granular consent UI (radio: essential/analytics/marketing per category)
 * atom-14-3: Last updated + revoke consent link
 *
 * PostHog opt-in strict: analytics consent = opt-in (never default true).
 * KVKK: essential cookies cannot be rejected (non-negotiable).
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { LegalLayout } from '@/components/legal/LegalLayout';

const LAST_UPDATED_ISO = '2026-05-10';
const LAST_UPDATED_DISPLAY = '10.05.2026';

const SECTION_KEYS = ['what', 'types', 'thirdParty', 'management', 'consent', 'contact'] as const;

/** Dispatches custom event for CookieBanner to re-open settings modal */
const openCookieSettings = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ecypro:open-cookie-settings'));
  }
};

type ConsentState = 'accept' | 'reject';

interface CookieCategory {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    key: 'essential',
    label: 'Zorunlu Çerezler',
    description:
      'Oturum yönetimi, güvenlik ve site işlevselliği için zorunludur. Devre dışı bırakılamaz.',
    required: true,
  },
  {
    key: 'analytics',
    label: 'Analitik Çerezler',
    description:
      'PostHog EU ile anonim trafik analizi. Kişisel veri işlenmez. Opt-in zorunludur (KVKK).',
    required: false,
  },
  {
    key: 'marketing',
    label: 'Pazarlama Çerezleri',
    description:
      'Hedefli içerik ve reklam için kullanılır. Şu an aktif değil; ilerleyen fazlarda devreye girebilir.',
    required: false,
  },
];

function readConsent(key: string): ConsentState | null {
  try {
    const stored = localStorage.getItem(`ecypro_cookie_${key}`);
    if (stored === 'accept' || stored === 'reject') return stored;
    return null;
  } catch {
    return null;
  }
}

function writeConsent(key: string, value: ConsentState): void {
  try {
    localStorage.setItem(`ecypro_cookie_${key}`, value);
    window.dispatchEvent(
      new CustomEvent('ecypro:cookie-consent-update', { detail: { key, value } }),
    );
  } catch {
    // localStorage unavailable — fail silently
  }
}

/** atom-14-2: Granular consent UI */
const GranularConsentPanel: React.FC = () => {
  const [consent, setConsent] = useState<Record<string, ConsentState>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const initial: Record<string, ConsentState> = {};
    COOKIE_CATEGORIES.forEach((cat) => {
      initial[cat.key] = cat.required ? 'accept' : (readConsent(cat.key) ?? 'reject');
    });
    setConsent(initial);
  }, []);

  const handleChange = (key: string, value: ConsentState) => {
    setConsent((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    COOKIE_CATEGORIES.forEach((cat) => {
      if (!cat.required) {
        writeConsent(cat.key, consent[cat.key] ?? 'reject');
      }
    });
    setSaved(true);
  };

  return (
    <div
      className="my-10 bg-white/5 border border-white/10 rounded-2xl p-6"
      data-testid="granular-consent-panel"
      aria-label="Çerez tercihleri"
    >
      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <Shield size={18} className="text-secondary" aria-hidden="true" />
        Çerez Tercihlerinizi Yönetin
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Her kategori için tercihlerinizi seçin. Zorunlu çerezler devre dışı bırakılamaz.
      </p>

      <div className="space-y-4">
        {COOKIE_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="border border-white/8 rounded-xl p-4"
            data-testid={`consent-category-${cat.key}`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-sm">{cat.label}</span>
                  {cat.required && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                      Zorunlu
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{cat.description}</p>
              </div>

              <fieldset
                className="flex gap-3 flex-shrink-0"
                disabled={cat.required}
                aria-label={`${cat.label} tercihi`}
              >
                <legend className="sr-only">{cat.label} tercihi</legend>
                <label
                  className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                    cat.required ? 'opacity-60 cursor-not-allowed' : ''
                  } ${consent[cat.key] === 'accept' ? 'text-emerald-400' : 'text-slate-400'}`}
                >
                  <input
                    type="radio"
                    name={`consent-${cat.key}`}
                    value="accept"
                    checked={consent[cat.key] === 'accept'}
                    onChange={() => !cat.required && handleChange(cat.key, 'accept')}
                    disabled={cat.required}
                    aria-label={`${cat.label} kabul`}
                    className="accent-emerald-400"
                    data-testid={`consent-${cat.key}-accept`}
                  />
                  Kabul
                </label>
                <label
                  className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                    cat.required ? 'opacity-60 cursor-not-allowed' : ''
                  } ${consent[cat.key] === 'reject' ? 'text-rose-400' : 'text-slate-400'}`}
                >
                  <input
                    type="radio"
                    name={`consent-${cat.key}`}
                    value="reject"
                    checked={consent[cat.key] === 'reject'}
                    onChange={() => !cat.required && handleChange(cat.key, 'reject')}
                    disabled={cat.required}
                    aria-label={`${cat.label} reddet`}
                    className="accent-rose-400"
                    data-testid={`consent-${cat.key}-reject`}
                  />
                  Reddet
                </label>
              </fieldset>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          data-testid="consent-save-btn"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-neutral font-semibold text-sm rounded-xl hover:bg-secondary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          Tercihleri Kaydet
        </button>
        {saved && (
          <div
            className="flex items-center gap-1.5 text-emerald-400 text-sm"
            role="status"
            aria-live="polite"
            data-testid="consent-saved-indicator"
          >
            <CheckCircle2 size={14} aria-hidden="true" />
            Kaydedildi
          </div>
        )}
      </div>

      {/* atom-14-3: Revoke consent link */}
      <div className="mt-4 pt-4 border-t border-white/8">
        <p className="text-xs text-slate-500">
          Tercihlerinizi istediğiniz zaman değiştirebilirsiniz.{' '}
          <button
            type="button"
            onClick={openCookieSettings}
            className="text-secondary hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary"
            data-testid="revoke-consent-btn"
          >
            Çerez ayarlarını yönet
          </button>
        </p>
      </div>

      <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
        <AlertCircle size={12} className="mt-0.5 flex-shrink-0 text-amber-500" aria-hidden="true" />
        <span>
          Analitik ve pazarlama çerezleri yalnızca açık onayınızla aktif olur. Zorunlu çerezler KVKK
          uyumu için gereklidir.
        </span>
      </div>
    </div>
  );
};

export const CookiePage: React.FC = () => {
  const { t } = useTranslation('legal');

  return (
    <LegalLayout
      title={t('cookies.title')}
      lastUpdated={LAST_UPDATED_ISO}
      lastUpdatedDisplay={LAST_UPDATED_DISPLAY}
      schemaName={t('cookies.title')}
      description={t('cookies.metaDescription')}
    >
      {/* atom-14-2: Granular consent UI */}
      <GranularConsentPanel />

      {/* Quick-access button for CookieBanner modal */}
      <div className="mb-8">
        <button
          type="button"
          onClick={openCookieSettings}
          className="inline-flex items-center px-6 py-3 rounded-lg bg-secondary text-neutral font-semibold text-sm hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-neutral transition-colors"
          data-testid="open-cookie-settings-btn"
        >
          {t('cookies.manageBtn')}
        </button>
      </div>

      {/* atom-14-1: Cookie policy body */}
      {SECTION_KEYS.map((key) => (
        <section key={key} className="mb-12" data-testid={`cookie-section-${key}`}>
          <h2>{t(`cookies.sections.${key}`)}</h2>
          <p>{t(`cookies.content.${key}`, { defaultValue: t('placeholder') })}</p>
        </section>
      ))}
    </LegalLayout>
  );
};
