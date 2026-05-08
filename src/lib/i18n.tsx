/* eslint-disable react-refresh/only-export-components */
/**
 * Phase 107a: thin wrapper over react-i18next.
 *
 * Inline `translations` map removed — single source of truth is now
 * `public/locales/{tr,en}/translation.json` (and additional namespaces).
 *
 * Legacy API preserved for backward compatibility:
 *   - `useTranslation()`  returns { language, t, toggleLanguage, i18n }
 *   - `I18nProvider`      no-op fragment (real init lives in `./i18n-react`)
 *   - `getLang()` + `MultiLang`  content-layer helpers (TR/EN object pick)
 *
 * Side-effect: importing this module triggers i18next bootstrap.
 */
import React, { ReactNode } from 'react';
import { useTranslation as useReactI18nTranslation } from 'react-i18next';
import './i18n-react';
import i18n from './i18n-react';

export type Language = 'tr' | 'en';
export type MultiLang = { tr: string; en: string };

export const getLang = (obj: MultiLang | string | undefined, lang: Language): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj['tr'] || '';
};

interface I18nContextType {
  language: Language;
  t: (key: string, options?: Record<string, unknown>) => string;
  toggleLanguage: () => void;
  i18n: typeof i18n;
}

/**
 * Drop-in replacement for the previous context-based hook.
 * Reads/writes language through i18next which already persists to
 * localStorage (`i18nextLng`) per `i18n-react` configuration.
 */
export const useTranslation = (): I18nContextType => {
  const { t, i18n: i18nInstance } = useReactI18nTranslation('translation');
  const language = ((i18nInstance.language ?? 'tr').split('-')[0] as Language) || 'tr';

  const toggleLanguage = () => {
    i18nInstance.changeLanguage(language === 'tr' ? 'en' : 'tr');
  };

  return {
    language,
    t: t as I18nContextType['t'],
    toggleLanguage,
    i18n: i18nInstance,
  };
};

/**
 * Backward-compat stub. The real i18n bootstrap is a side-effect of importing
 * `./i18n-react`, which happens at module load. The provider is kept so
 * existing call sites in `AppProviders.tsx` continue to render.
 */
export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
