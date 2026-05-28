import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  hasEnVersion: boolean;
  trSlug: string;
  enSlug?: string;
  currentLang: 'tr' | 'en';
}

export function LanguageSwitcher({
  hasEnVersion,
  trSlug,
  enSlug,
  currentLang,
}: LanguageSwitcherProps) {
  const { t } = useTranslation('insights');

  if (!hasEnVersion) {
    return (
      <span
        data-testid="language-switcher"
        className="inline-flex items-center gap-1.5 px-[13px] py-[5px] rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium"
      >
        {t('languageSwitcher.trOnly')}
      </span>
    );
  }

  return (
    <div data-testid="language-switcher" className="flex items-center gap-[8px]">
      <Link
        to={`/insights/${trSlug}`}
        className={[
          'px-[13px] py-[5px] rounded-full text-sm font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
          currentLang === 'tr'
            ? 'bg-amber-500 text-slate-900'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700',
        ].join(' ')}
        lang="tr"
      >
        TR
      </Link>
      {enSlug && (
        <Link
          to={`/en/insights/${enSlug}`}
          className={[
            'px-[13px] py-[5px] rounded-full text-sm font-medium transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
            currentLang === 'en'
              ? 'bg-amber-500 text-slate-900'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700',
          ].join(' ')}
          lang="en"
        >
          EN
        </Link>
      )}
    </div>
  );
}
