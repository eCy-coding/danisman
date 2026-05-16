import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = (i18n.language || 'en').startsWith('tr') ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleLanguage}
      data-testid="language-toggle"
      className={`
        fixed bottom-6 left-20 z-50 min-w-11 min-h-11 p-3 rounded-full shadow-lg transition-all duration-300
        bg-neutral-900/80 text-slate-200 border border-white/10 hover:bg-white/10
      `}
      aria-label={
        (i18n.language || 'en').startsWith('tr')
          ? 'TR — Switch language to English'
          : "EN — Dili Türkçe'ye değiştir"
      }
      title={(i18n.language || 'en').startsWith('tr') ? 'Switch to English' : 'Türkçe\'ye Geç'}
    >
      <div className="flex items-center justify-center gap-1 font-bold text-xs">
        <Globe size={16} aria-hidden="true" />
        <span>{(i18n.language || 'en').startsWith('tr') ? 'TR' : 'EN'}</span>
      </div>
    </motion.button>
  );
};
