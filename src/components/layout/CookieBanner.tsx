import React, { useState, useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';
import { useTranslation } from '../../lib/i18n';
import { COOKIE_BANNER_COPY } from '@/data/copy/common';

export const CookieBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = ((i18n.language || 'en').startsWith('tr') ? 'tr' : 'en') as 'tr' | 'en';
  const modalTitleId = useId();
  const analyticsId = useId();
  const marketingId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('ecypro_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  // Allow other components (e.g. CookiePage "Çerez Ayarları" button) to re-open the modal.
  useEffect(() => {
    const handler = () => {
      setIsVisible(true);
      setShowSettings(true);
    };
    window.addEventListener('ecypro:open-cookie-settings', handler);
    return () => window.removeEventListener('ecypro:open-cookie-settings', handler);
  }, []);

  const handleAcceptAll = () => {
    setPreferences({ essential: true, analytics: true, marketing: true });
    saveConsent('all');
  };

  const handleSavePreferences = () => {
    saveConsent('custom');
  };

  const saveConsent = (type: string) => {
    localStorage.setItem(
      'ecypro_cookie_consent',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type: type,
        preferences:
          type === 'all' ? { essential: true, analytics: true, marketing: true } : preferences,
      }),
    );
    trackEvent('CookieBanner', 'Consent', type);
    setIsVisible(false);
    setShowSettings(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Main Banner */}
      {!showSettings && (
        <div className="fixed bottom-0 left-0 w-full bg-neutral border-t border-white/10 p-6 z-50 animate-in slide-in-from-bottom-5 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-slate-400 font-light max-w-2xl text-center md:text-left">
              {COOKIE_BANNER_COPY.text[lang]}{' '}
              <Link
                to="/cookies"
                className="text-secondary underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                {t('legal:cookies.bannerLink')}
              </Link>
            </p>
            <div className="flex space-x-4 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="text-sm font-bold text-slate-400 hover:text-secondary transition-colors px-4 py-2"
              >
                {COOKIE_BANNER_COPY.settings[lang]}
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="btn-premium-gold text-sm font-bold px-8 py-3 rounded-lg transition-colors shadow-md outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                {COOKIE_BANNER_COPY.accept[lang]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="bg-neutral border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 md:p-8 animate-in zoom-in-95"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 id={modalTitleId} className="text-xl font-sans font-medium text-[#E3E3E3]">
                {COOKIE_BANNER_COPY.modalTitle[lang]}
              </h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                aria-label="Kapat"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md text-slate-400 hover:text-primary focus-visible:ring-2 focus-visible:ring-secondary outline-none"
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            <p className="text-slate-400 text-sm mb-6">{COOKIE_BANNER_COPY.modalDesc[lang]}</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <h4 className="font-bold text-primary text-sm">
                    {COOKIE_BANNER_COPY.essential[lang]}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {COOKIE_BANNER_COPY.essentialDesc[lang]}
                  </p>
                </div>
                <div className="text-xs font-bold text-slate-400 bg-white/10 px-2 py-1 rounded">
                  {COOKIE_BANNER_COPY.alwaysActive[lang]}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
                <div>
                  <h4 className="font-bold text-primary text-sm">
                    {COOKIE_BANNER_COPY.analytics[lang]}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {COOKIE_BANNER_COPY.analyticsDesc[lang]}
                  </p>
                </div>
                <label
                  htmlFor={analyticsId}
                  className="relative inline-flex items-center cursor-pointer"
                  aria-label={COOKIE_BANNER_COPY.analytics[lang]}
                >
                  <input
                    id={analyticsId}
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div
                    aria-hidden="true"
                    className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"
                  ></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
                <div>
                  <h4 className="font-bold text-primary text-sm">
                    {COOKIE_BANNER_COPY.marketing[lang]}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {COOKIE_BANNER_COPY.marketingDesc[lang]}
                  </p>
                </div>
                <label
                  htmlFor={marketingId}
                  className="relative inline-flex items-center cursor-pointer"
                  aria-label={COOKIE_BANNER_COPY.marketing[lang]}
                >
                  <input
                    id={marketingId}
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div
                    aria-hidden="true"
                    className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"
                  ></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="text-sm font-bold text-slate-400 hover:text-white px-4 py-2"
              >
                {COOKIE_BANNER_COPY.acceptAll[lang]}
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="btn-premium-gold text-sm font-bold px-6 py-3 rounded-lg transition-colors"
              >
                {COOKIE_BANNER_COPY.save[lang]}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
