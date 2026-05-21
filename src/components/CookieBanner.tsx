import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DEFAULT_PREFS,
  readConsent,
  writeConsent,
  type ConsentPreferences,
} from '../lib/consent-v1';

const COPY = {
  banner: {
    tr: 'Sitemizi geliştirmek için çerez kullanıyoruz. KVKK m.5 uyarınca açık rızanız olmadan analitik ve pazarlama çerezleri yüklenmez. Tercihinizi seçiniz.',
    en: 'We use cookies to improve our site. Under KVKK Art.5, analytics and marketing cookies are not loaded without your explicit consent. Please choose your preference.',
  },
  acceptAll: { tr: 'Tümünü Kabul Et', en: 'Accept All' },
  rejectAll: { tr: 'Tümünü Reddet', en: 'Reject All' },
  settings: { tr: 'Ayarlar', en: 'Settings' },
  modalTitle: { tr: 'Çerez Ayarları', en: 'Cookie Settings' },
  modalDesc: {
    tr: 'Hangi çerezleri kabul etmek istediğinizi seçiniz. Zorunlu çerezler sitenin temel işlevleri için her zaman aktiftir.',
    en: 'Choose which cookies you wish to accept. Essential cookies are always active for core site functionality.',
  },
  necessary: { tr: 'Zorunlu Çerezler', en: 'Essential Cookies' },
  necessaryDesc: {
    tr: 'Oturum, güvenlik ve temel işlevsellik için gereklidir. Devre dışı bırakılamaz.',
    en: 'Required for session, security, and core functionality. Cannot be disabled.',
  },
  alwaysActive: { tr: 'Her zaman aktif', en: 'Always active' },
  functional: { tr: 'İşlevsel Çerezler', en: 'Functional Cookies' },
  functionalDesc: {
    tr: 'Dil tercihi ve kişiselleştirme. Deneyiminizi hatırlamamıza yardımcı olur.',
    en: 'Language preference and personalization. Helps us remember your experience.',
  },
  analytics: { tr: 'Analitik Çerezler', en: 'Analytics Cookies' },
  analyticsDesc: {
    tr: 'Ziyaret istatistikleri (PostHog, AB sunucusu). Sitemizi geliştirmemizi sağlar.',
    en: 'Visit statistics (PostHog, EU server). Helps us improve our site.',
  },
  marketing: { tr: 'Pazarlama Çerezleri', en: 'Marketing Cookies' },
  marketingDesc: {
    tr: 'Reklam ve yeniden hedefleme (GTM). İlgi alanlarınıza göre içerik göstermek için.',
    en: 'Advertising and retargeting (GTM). To show content matching your interests.',
  },
  save: { tr: 'Tercihleri Kaydet', en: 'Save Preferences' },
  close: { tr: 'Kapat', en: 'Close' },
  detail: { tr: 'Detaylı Aydınlatma Metni', en: 'Detailed Privacy Notice' },
};

type Lang = 'tr' | 'en';

function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'tr';
  return navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

export const CookieBanner: React.FC = () => {
  const [lang] = useState<Lang>(detectLang);
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>(DEFAULT_PREFS);
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (readConsent() === null) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const current = readConsent();
      if (current) {
        setPrefs({
          analytics: current.analytics,
          marketing: current.marketing,
          functional: current.functional,
        });
      }
      setIsVisible(true);
      setShowSettings(true);
    };
    window.addEventListener('ecypro:open-cookie-settings', handler);
    return () => window.removeEventListener('ecypro:open-cookie-settings', handler);
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
    setShowSettings(false);
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    writeConsent({ analytics: true, marketing: true, functional: true });
    close();
  }, [close]);

  const handleRejectAll = useCallback(() => {
    writeConsent({ analytics: false, marketing: false, functional: false });
    close();
  }, [close]);

  const handleSave = useCallback(() => {
    writeConsent(prefs);
    close();
  }, [prefs, close]);

  useEffect(() => {
    if (!showSettings) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    firstFocusableRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSettings(false);
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showSettings]);

  if (!isVisible) return null;

  if (showSettings) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <button
          type="button"
          aria-label={COPY.close[lang]}
          onClick={() => setShowSettings(false)}
          className="absolute inset-0 bg-black/60 outline-none"
        />
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative bg-ecypro-ink border border-ecypro-gold/20 rounded-2xl w-full max-w-lg shadow-2xl p-6 md:p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 id={titleId} className="text-xl font-bold text-white">
              {COPY.modalTitle[lang]}
            </h2>
            <button
              ref={firstFocusableRef}
              type="button"
              onClick={() => setShowSettings(false)}
              aria-label={COPY.close[lang]}
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-ecypro-gold outline-none"
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                ×
              </span>
            </button>
          </div>

          <p className="text-slate-300 text-sm mb-6">{COPY.modalDesc[lang]}</p>

          <div className="space-y-3 mb-8">
            <CategoryRow
              title={COPY.necessary[lang]}
              desc={COPY.necessaryDesc[lang]}
              badge={COPY.alwaysActive[lang]}
            />
            <CategoryToggle
              title={COPY.functional[lang]}
              desc={COPY.functionalDesc[lang]}
              checked={prefs.functional}
              onChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
              ariaLabel={COPY.functional[lang]}
            />
            <CategoryToggle
              title={COPY.analytics[lang]}
              desc={COPY.analyticsDesc[lang]}
              checked={prefs.analytics}
              onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
              ariaLabel={COPY.analytics[lang]}
            />
            <CategoryToggle
              title={COPY.marketing[lang]}
              desc={COPY.marketingDesc[lang]}
              checked={prefs.marketing}
              onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
              ariaLabel={COPY.marketing[lang]}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={handleRejectAll}
              data-testid="cookie-reject-all"
              className="text-sm font-bold border border-white/15 text-slate-200 hover:bg-white/5 transition-colors px-6 py-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ecypro-gold"
            >
              {COPY.rejectAll[lang]}
            </button>
            <button
              type="button"
              onClick={handleSave}
              data-testid="cookie-save"
              className="text-sm font-bold bg-ecypro-gold text-ecypro-navy hover:opacity-90 transition-opacity px-6 py-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ecypro-gold"
            >
              {COPY.save[lang]}
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            <Link
              to="/cookies"
              className="text-ecypro-gold underline underline-offset-2 hover:opacity-80"
            >
              {COPY.detail[lang]}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={COPY.modalTitle[lang]}
      data-testid="cookie-banner"
      className="fixed bottom-0 left-0 right-0 z-[9998] bg-ecypro-ink border-t border-ecypro-gold/20 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
        <p className="text-sm text-slate-300 leading-relaxed flex-1">
          {COPY.banner[lang]}{' '}
          <Link
            to="/cookies"
            className="text-ecypro-gold underline underline-offset-2 hover:opacity-80"
          >
            {COPY.detail[lang]}
          </Link>
        </p>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            data-testid="cookie-settings"
            className="text-sm font-bold text-slate-300 hover:text-white px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ecypro-gold rounded-lg"
          >
            {COPY.settings[lang]}
          </button>
          <button
            type="button"
            onClick={handleRejectAll}
            data-testid="cookie-reject-all"
            className="text-sm font-bold border border-white/15 text-slate-200 hover:bg-white/5 transition-colors px-5 py-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ecypro-gold"
          >
            {COPY.rejectAll[lang]}
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            data-testid="cookie-accept-all"
            className="text-sm font-bold bg-ecypro-gold text-ecypro-navy hover:opacity-90 transition-opacity px-5 py-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ecypro-gold"
          >
            {COPY.acceptAll[lang]}
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoryRow: React.FC<{ title: string; desc: string; badge: string }> = ({
  title,
  desc,
  badge,
}) => (
  <div className="flex items-start justify-between gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
    <div>
      <h3 className="font-bold text-white text-sm">{title}</h3>
      <p className="text-xs text-slate-400 mt-1">{desc}</p>
    </div>
    <span className="text-xs font-bold text-slate-300 bg-white/10 px-2 py-1 rounded shrink-0">
      {badge}
    </span>
  </div>
);

const CategoryToggle: React.FC<{
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}> = ({ title, desc, checked, onChange, ariaLabel }) => {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 p-4 border border-white/10 rounded-lg">
      <div>
        <h3 className="font-bold text-white text-sm">{title}</h3>
        <p className="text-xs text-slate-400 mt-1">{desc}</p>
      </div>
      <label
        htmlFor={id}
        aria-label={ariaLabel}
        className="relative inline-flex items-center cursor-pointer shrink-0"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          aria-hidden="true"
          className="w-11 h-6 bg-white/10 rounded-full peer peer-focus:ring-2 peer-focus:ring-ecypro-gold peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ecypro-gold"
        />
      </label>
    </div>
  );
};

export default CookieBanner;
