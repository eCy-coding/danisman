/**
 * LegalLayout — shared layout for Privacy, Terms, Cookie policy pages.
 * - DRAFT disclaimer always visible
 * - StickyTableOfContents (auto-detects h2/h3 from contentRef)
 * - JSON-LD WebPage schema
 * - Breadcrumb navigation
 * - Fibonacci/golden-ratio spacing
 */

import React, { useRef, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { FadeIn } from '@/components/common/FadeIn';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { StickyTableOfContents } from '@/components/ui/StickyTableOfContents';
import { LegalDisclaimer } from '@/components/legal/LegalDisclaimer';
import { useTranslation } from '@/lib/i18n';

interface LegalLayoutProps {
  /** Page title (plain string, already translated by caller) */
  title: string;
  /** ISO date string, e.g. "2026-05-10" */
  lastUpdated: string;
  /** Displayed date string, e.g. "10.05.2026" */
  lastUpdatedDisplay: string;
  /** JSON-LD document name */
  schemaName: string;
  /** Meta description */
  description?: string;
  children: ReactNode;
}

function LegalDocumentSchema({
  name,
  dateModified,
}: {
  name: string;
  dateModified: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    dateModified,
    publisher: {
      '@type': 'Organization',
      name: 'EcyPro Premium Consulting',
      url: 'https://www.ecypro.com',
    },
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  lastUpdated,
  lastUpdatedDisplay,
  schemaName,
  description,
  children,
}) => {
  const { language } = useTranslation();
  const contentRef = useRef<HTMLElement>(null);

  const lastUpdatedLabel = language === 'tr' ? 'Son Güncelleme' : 'Last Updated';

  return (
    <FadeIn>
      <Helmet>
        <title>{title} | EcyPro</title>
        {description && <meta name="description" content={description} />}
      </Helmet>

      <LegalDocumentSchema name={schemaName} dateModified={lastUpdated} />

      <div className="min-h-screen bg-neutral text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24">
          <Breadcrumb
            items={[{ label: { tr: title, en: title } }]}
            className="mb-6"
          />

          <LegalDisclaimer />

          <div className="flex gap-12 items-start">
            {/* Main content column */}
            <article
              ref={contentRef}
              className="flex-1 min-w-0 max-w-4xl"
            >
              <header className="mb-8 border-b border-white/10 pb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
                <p className="text-sm text-slate-400">
                  {lastUpdatedLabel}: {lastUpdatedDisplay}
                </p>
              </header>

              <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:font-semibold prose-headings:text-white prose-a:text-secondary prose-strong:text-white prose-table:text-xs prose-td:py-2 prose-th:py-2 legal-content">
                {children}
              </div>
            </article>

            {/* Sticky TOC — desktop only */}
            <StickyTableOfContents contentRef={contentRef} />
          </div>
        </div>
      </div>
    </FadeIn>
  );
};
