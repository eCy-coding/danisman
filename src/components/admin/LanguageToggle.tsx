import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGS } from '../../lib/i18n-react';

const LANG_LABELS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
};

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language ?? 'tr';

  const handleChange = (lang: string) => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div className="relative flex items-center gap-1" role="group" aria-label="Language selector">
      <Globe size={14} className="text-slate-400" aria-hidden="true" />
      {SUPPORTED_LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => handleChange(lang)}
          aria-pressed={current === lang}
          aria-label={`Switch to ${LANG_LABELS[lang]}`}
          className={[
            'px-2 py-0.5 rounded text-xs font-medium transition-colors',
            current === lang
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5',
          ].join(' ')}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
