/**
 * Phase 105a: keyboard-first navigation skip link.
 *
 * Renders an off-screen anchor that becomes visible only when focused
 * (`focus:not-sr-only`), letting Tab-key users jump past the navbar
 * straight to the main content. Anchors to the same `#main-content`
 * id that `MainLayout` puts on its <main> element.
 *
 * Bilingual label sourced from the `common` namespace (`skip_to_content`)
 * so copy stays single-sourced and TR/EN parity is enforced by i18n.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface SkipLinksProps {
  /** Anchor target id. Defaults to `main-content` (the MainLayout id). */
  targetId?: string;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ targetId = 'main-content' }) => {
  const { t } = useTranslation('common');

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:font-bold focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {t('skip_to_content')}
    </a>
  );
};
