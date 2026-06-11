import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Eye, EyeOff, Globe, Settings2, X } from 'lucide-react';
import { useZenStore } from '@/lib/stores/zenStore';
import { hasConsent } from '@/lib/consent';
import { CONTACT_CONFIG } from '@/constants';
import { trackEvent } from '@/lib/analytics';

/**
 * UtilityDock — BUG-08/D-6 float governance: the former ZenToggle and
 * LanguageToggle floats are merged into ONE persistent control. Collapsed it
 * is a single 44px button; expanded it reveals both actions in place.
 * aria-labels and data-testids of the original controls are preserved so the
 * existing zen/i18n e2e contracts keep holding.
 */
export const UtilityDock: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { isZenMode, toggleZen } = useZenStore();
  const { i18n } = useTranslation();
  const isTr = (i18n.language || 'en').startsWith('tr');

  useEffect(() => {
    if (isZenMode) {
      document.documentElement.classList.add('zen-mode');
    } else {
      document.documentElement.classList.remove('zen-mode');
    }
  }, [isZenMode]);

  const toggleLanguage = () => {
    const newLang = isTr ? 'en' : 'tr';
    void i18n.changeLanguage(newLang);
    // KVKK: persist only after analytics consent; i18n caches:[] prevents auto-write
    if (hasConsent('analytics')) {
      localStorage.setItem('i18nextLng', newLang);
    }
  };

  return (
    <div data-testid="utility-dock" className="fixed bottom-6 left-6 z-50 flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Yardımcı araçları kapat' : 'Yardımcı araçlar (görünüm ve dil)'}
        title="Görünüm & Dil"
        className="min-w-11 min-h-11 p-3 rounded-full shadow-lg bg-neutral-900/80 text-slate-200 border border-white/10 hover:bg-white/10 transition-all duration-300"
      >
        {open ? <X size={20} aria-hidden="true" /> : <Settings2 size={20} aria-hidden="true" />}
      </motion.button>

      {open && (
        <>
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={toggleZen}
            aria-label={isZenMode ? 'Disable Zen Mode' : 'Enable Zen Mode'}
            title="Zen Mode (Reading View)"
            className={`min-w-11 min-h-11 p-3 rounded-full shadow-lg transition-all duration-300 ${
              isZenMode
                ? 'bg-black text-white border border-gray-800'
                : 'bg-neutral-900/80 text-slate-200 border border-white/10 hover:bg-white/10'
            }`}
          >
            {isZenMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={toggleLanguage}
            data-testid="language-toggle"
            aria-label={isTr ? 'TR — Switch language to English' : "EN — Dili Türkçe'ye değiştir"}
            title={isTr ? 'Switch to English' : "Türkçe'ye Geç"}
            className="min-w-11 min-h-11 p-3 rounded-full shadow-lg bg-neutral-900/80 text-slate-200 border border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            <span className="flex items-center justify-center gap-1 font-bold text-xs">
              <Globe size={16} aria-hidden="true" />
              <span>{isTr ? 'TR' : 'EN'}</span>
            </span>
          </motion.button>

          {CONTACT_CONFIG.whatsapp && (
            <motion.a
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.95 }}
              href={CONTACT_CONFIG.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('UtilityDock', 'Click', 'whatsapp')}
              aria-label="WhatsApp ile iletişime geç"
              title="WhatsApp ile iletişime geç"
              data-testid="whatsapp-floating-button"
              className="min-w-11 min-h-11 p-3 rounded-full shadow-lg flex items-center justify-center text-white"
              style={{ backgroundColor: '#25D366' }}
            >
              <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true" fill="white">
                <path d="M16.003 3.2C9.13 3.2 3.557 8.773 3.557 15.647c0 2.198.575 4.347 1.665 6.243L3.2 28.8l7.057-1.957a12.388 12.388 0 0 0 5.743 1.452h.005c6.873 0 12.448-5.573 12.448-12.448 0-3.328-1.296-6.456-3.65-8.81-2.353-2.357-5.481-3.643-8.81-3.643Zm0 22.654a10.35 10.35 0 0 1-5.276-1.446l-.378-.224-3.918 1.087 1.106-3.823-.246-.392a10.31 10.31 0 0 1-1.586-5.51c0-5.703 4.643-10.347 10.347-10.347a10.27 10.27 0 0 1 7.318 3.034 10.27 10.27 0 0 1 3.032 7.32c.001 5.703-4.646 10.301-10.4 10.301Zm5.679-7.755c-.314-.157-1.86-.917-2.148-1.023-.287-.106-.497-.157-.706.157-.21.314-.81 1.023-.992 1.233-.183.21-.366.236-.68.078-.314-.157-1.328-.49-2.53-1.56-.935-.835-1.566-1.864-1.748-2.18-.183-.314-.02-.484.137-.64.14-.14.314-.366.471-.549.157-.183.21-.314.314-.523.105-.21.052-.392-.026-.549-.078-.157-.706-1.703-.967-2.33-.255-.612-.514-.53-.706-.54-.183-.01-.392-.012-.601-.012a1.155 1.155 0 0 0-.836.392c-.288.314-1.097 1.073-1.097 2.617s1.124 3.036 1.281 3.247c.157.21 2.21 3.376 5.358 4.736.749.324 1.333.516 1.788.66.751.239 1.434.205 1.974.124.602-.09 1.86-.76 2.122-1.494.262-.733.262-1.36.183-1.494-.078-.131-.288-.21-.601-.366Z" />
              </svg>
            </motion.a>
          )}
        </>
      )}
    </div>
  );
};
