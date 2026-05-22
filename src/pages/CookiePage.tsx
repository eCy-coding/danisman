/**
 * CookiePage — Cookie Policy page.
 * Skeleton sections rendered via i18n `legal` namespace.
 * Real legal copy to be filled by qualified counsel before P1.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { LegalLayout } from '@/components/legal/LegalLayout';

const LAST_UPDATED_ISO = '2026-05-10';
const LAST_UPDATED_DISPLAY = '10.05.2026';

const SECTION_KEYS = ['what', 'types', 'thirdParty', 'management', 'consent', 'contact'] as const;

/**
 * Dispatches a custom event the CookieBanner can listen for to re-open
 * the settings modal from anywhere on the site.
 */
const openCookieSettings = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ecypro:open-cookie-settings'));
  }
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
      <div className="mb-8">
        <button
          type="button"
          onClick={openCookieSettings}
          className="inline-flex items-center px-6 py-3 rounded-lg bg-secondary text-neutral font-semibold text-sm hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-neutral transition-colors"
        >
          {t('cookies.manageBtn')}
        </button>
      </div>

      {SECTION_KEYS.map((key) => (
        <section key={key} className="mb-12">
          <h2>{t(`cookies.sections.${key}`)}</h2>
          <p>{t(`cookies.content.${key}`, { defaultValue: t('placeholder') })}</p>
        </section>
      ))}
    </LegalLayout>
  );
};
