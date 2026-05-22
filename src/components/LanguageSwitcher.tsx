import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { resolveLocale, swapLocaleInPath, type Locale } from '@/i18n/helpers';

interface LanguageSwitcherProps {
  className?: string;
}

const LOCALES: { code: Locale; label: string; aria: string }[] = [
  { code: 'tr', label: 'TR', aria: 'Türkçe' },
  { code: 'en', label: 'EN', aria: 'English' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { locale } = useParams<{ locale: string }>();

  const current = resolveLocale(locale ?? i18n.language);

  const switchTo = (next: Locale) => {
    if (next === current) return;
    void i18n.changeLanguage(next);
    navigate(swapLocaleInPath(pathname, next));
  };

  return (
    <div
      className={`lang-switcher inline-flex items-center gap-1 text-xs font-bold ${className ?? ''}`}
      role="group"
      aria-label="Language switcher"
      data-testid="language-switcher"
    >
      {LOCALES.map((l, i) => (
        <React.Fragment key={l.code}>
          {i > 0 && (
            <span className="text-slate-400" aria-hidden="true">
              |
            </span>
          )}
          <button
            type="button"
            onClick={() => switchTo(l.code)}
            aria-pressed={current === l.code}
            aria-label={l.aria}
            data-testid={`lang-${l.code}`}
            className={`min-w-9 min-h-9 px-2 py-1 rounded transition-colors ${
              current === l.code
                ? 'text-secondary'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {l.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
