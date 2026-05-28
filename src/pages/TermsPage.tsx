/**
 * TermsPage — Terms of Service page.
 * atom-13-1: Body (service terms + engagement model + payment terms)
 * atom-13-2: Sticky CTA "Anlaşıldı, Tanışma Toplantısı Planla"
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
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

/** Sticky CTA — appears after user scrolls 40% of page height */
const StickyTermsCta: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const threshold = document.documentElement.scrollHeight * 0.4;
    const handleScroll = () => {
      setVisible(window.scrollY > threshold);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div
      className="fixed bottom-6 left-0 right-0 px-4 z-50 pointer-events-none"
      data-testid="terms-sticky-cta"
    >
      <div className="max-w-xl mx-auto pointer-events-auto bg-secondary text-neutral rounded-2xl shadow-2xl border border-secondary/30 px-5 py-4 flex items-center gap-4">
        <FileText size={18} className="text-neutral flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Hizmet şartlarını inceledim</p>
          <p className="text-xs opacity-70 mt-0.5">
            Sorularınız için 30 dk keşif görüşmesi planlayın
          </p>
        </div>
        <Link
          to="/discovery"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-secondary font-semibold text-xs rounded-xl hover:bg-neutral-800 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          data-testid="terms-sticky-cta-link"
        >
          Tanışma Toplantısı Planla <ArrowRight size={12} aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Kapat"
          className="flex-shrink-0 w-8 h-8 min-h-[32px] min-w-[32px] rounded-full hover:bg-black/10 transition-colors flex items-center justify-center text-neutral text-xs font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  const { t } = useTranslation('legal');

  return (
    <>
      <LegalLayout
        title={t('terms.title')}
        lastUpdated={LAST_UPDATED_ISO}
        lastUpdatedDisplay={LAST_UPDATED_DISPLAY}
        schemaName={t('terms.title')}
        description={t('terms.metaDescription')}
      >
        {/* atom-13-1: Body sections */}
        {SECTION_KEYS.map((key) => (
          <section key={key} className="mb-12" data-testid={`terms-section-${key}`}>
            <h2>{t(`terms.sections.${key}`)}</h2>
            <p>{t(`terms.content.${key}`, { defaultValue: t('placeholder') })}</p>
          </section>
        ))}

        {/* Inline CTA at end of content */}
        <div
          className="mt-12 p-6 bg-secondary/5 border border-secondary/20 rounded-2xl text-center"
          data-testid="terms-inline-cta"
        >
          <p className="text-sm text-slate-300 mb-4">
            Şartları okudunuz. Hizmetlerimiz hakkında daha fazla bilgi almak için:
          </p>
          <Link
            to="/discovery"
            className="inline-flex items-center gap-2 px-5 py-3 bg-secondary text-neutral font-semibold text-sm rounded-xl hover:bg-secondary/90 transition-colors"
          >
            Anlaşıldı, Tanışma Toplantısı Planla <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </LegalLayout>

      {/* atom-13-2: Sticky CTA */}
      <StickyTermsCta />
    </>
  );
};
