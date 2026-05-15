/**
 * PrivacyPage — KVKK + GDPR compliant Privacy Policy page.
 * Skeleton sections rendered via i18n `legal` namespace.
 * Real legal copy to be filled by qualified counsel before P1.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { LegalLayout } from '@/components/legal/LegalLayout';

const LAST_UPDATED_ISO = '2026-05-10';
const LAST_UPDATED_DISPLAY = '10.05.2026';

const SECTION_KEYS = [
  'controller',
  'data',
  'purpose',
  'retention',
  'rights',
  'transfer',
  'contact',
] as const;

export const PrivacyPage: React.FC = () => {
  const { t } = useTranslation('legal');

  return (
    <LegalLayout
      title={t('privacy.title')}
      lastUpdated={LAST_UPDATED_ISO}
      lastUpdatedDisplay={LAST_UPDATED_DISPLAY}
      schemaName={t('privacy.title')}
      description={t('privacy.metaDescription')}
    >
      {SECTION_KEYS.map((key) => (
        <section key={key} className="mb-12">
          <h2>{t(`privacy.sections.${key}`)}</h2>
          <p>{t(`privacy.content.${key}`, { defaultValue: t('placeholder') })}</p>
        </section>
      ))}
    </LegalLayout>
  );
};
