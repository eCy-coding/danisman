/**
 * TermsPage — Terms of Service page.
 * Skeleton sections rendered via i18n `legal` namespace.
 * Real legal copy to be filled by qualified counsel before P1.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { LegalLayout } from '@/components/legal/LegalLayout';

const LAST_UPDATED_ISO = '2026-05-10';
const LAST_UPDATED_DISPLAY = '10.05.2026';

const SECTION_KEYS = [
  'scope',
  'independence',
  'obligations',
  'payment',
  'liability',
  'ip',
  'dispute',
  'contact',
] as const;

export const TermsPage: React.FC = () => {
  const { t } = useTranslation('legal');

  return (
    <LegalLayout
      title={t('terms.title')}
      lastUpdated={LAST_UPDATED_ISO}
      lastUpdatedDisplay={LAST_UPDATED_DISPLAY}
      schemaName={t('terms.title')}
      description={t('terms.metaDescription')}
    >
      {SECTION_KEYS.map((key) => (
        <section key={key} className="mb-12">
          <h2>{t(`terms.sections.${key}`)}</h2>
          <p>{t(`terms.content.${key}`, { defaultValue: t('placeholder') })}</p>
        </section>
      ))}
    </LegalLayout>
  );
};
