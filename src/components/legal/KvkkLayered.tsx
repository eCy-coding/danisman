/**
 * KvkkLayered — KVKK m.10 + GDPR Art.13 layered consent disclosure.
 *
 * Pattern: short summary inline under a form, with a modal trigger that
 * surfaces the full Aydınlatma Metni (information notice). Used under every
 * data-collecting form (Contact, Newsletter, ROI/KVKK Quick-Check) so the
 * controller's article 10 / article 13 duty is discharged at the point of
 * collection — not buried in a separate privacy page.
 *
 * Brand voice: formal "Siz", aktif fiil, no hedge phrases. KVKK + GDPR
 * articles cited verbatim. Tailwind utility classes only (no glassmorphism).
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, X, ShieldCheck, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface KvkkLayeredProps {
  /**
   * Hukuki sebep — purpose-specific legal basis (KVKK md.5/2). Defaults to
   * "f" (meşru menfaat) for contact-style forms. Use "a" for explicit
   * consent flows (newsletter, marketing).
   */
  basis?: 'a' | 'c' | 'e' | 'f';
  /** Optional override for the short summary line. */
  summary?: { tr: string; en: string };
  /** Optional retention window override (e.g. "12 ay"). */
  retention?: { tr: string; en: string };
  /** Optional className applied to the wrapper. */
  className?: string;
}

const BASIS_LABEL: Record<NonNullable<KvkkLayeredProps['basis']>, { tr: string; en: string }> = {
  a: {
    tr: 'KVKK md.5/2(a) — açık rıza',
    en: 'KVKK art. 5/2(a) — explicit consent',
  },
  c: {
    tr: 'KVKK md.5/2(c) — sözleşmenin kurulması veya ifası',
    en: 'KVKK art. 5/2(c) — performance of a contract',
  },
  e: {
    tr: 'KVKK md.5/2(e) — hakkın tesisi, kullanılması veya korunması',
    en: 'KVKK art. 5/2(e) — establishment or exercise of a legal right',
  },
  f: {
    tr: 'KVKK md.5/2(f) — meşru menfaat',
    en: 'KVKK art. 5/2(f) — legitimate interest',
  },
};

const GDPR_BASIS: Record<NonNullable<KvkkLayeredProps['basis']>, string> = {
  a: 'GDPR Art. 6(1)(a)',
  c: 'GDPR Art. 6(1)(b)',
  e: 'GDPR Art. 6(1)(c)',
  f: 'GDPR Art. 6(1)(f)',
};

export const KvkkLayered: React.FC<KvkkLayeredProps> = ({
  basis = 'f',
  summary,
  retention,
  className,
}) => {
  const { language } = useTranslation();
  const lang: 'tr' | 'en' = language === 'tr' ? 'tr' : 'en';
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const summaryText =
    summary?.[lang] ??
    (lang === 'tr'
      ? `Verileriniz ${BASIS_LABEL[basis].tr} kapsamında işlenir.`
      : `Your data is processed under ${BASIS_LABEL[basis].en}.`);

  const triggerLabel = lang === 'tr' ? 'Detaylı aydınlatma metni' : 'Detailed information notice';
  const retentionText =
    retention?.[lang] ??
    (lang === 'tr'
      ? 'Talebinizin sonuçlanmasından itibaren 12 ay; yasal saklama yükümlülükleri saklıdır.'
      : '12 months from resolution of your request; statutory retention obligations reserved.');

  return (
    <div
      className={`flex items-start gap-2 text-xs text-slate-400 leading-relaxed ${className ?? ''}`}
      data-testid="kvkk-layered"
    >
      <ShieldCheck size={14} className="text-secondary shrink-0 mt-0.5" aria-hidden="true" />
      <p className="flex-1">
        <span>{summaryText}</span>{' '}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          data-testid="kvkk-layered-trigger"
          className="inline text-secondary underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 rounded"
        >
          {triggerLabel}
        </button>
      </p>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          data-testid="kvkk-layered-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <button
            type="button"
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            onClick={close}
            tabIndex={-1}
            className="absolute inset-0 bg-black/70 cursor-default"
          />
          <div className="relative z-[101] w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-neutral text-slate-300 shadow-2xl">
            <header className="sticky top-0 flex items-center justify-between gap-4 border-b border-white/10 bg-neutral/95 backdrop-blur-0 p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary">
                  <Info size={18} aria-hidden="true" />
                </span>
                <h2 id={titleId} className="text-base font-semibold text-white">
                  {lang === 'tr' ? 'KVKK m.10 Aydınlatma Metni' : 'KVKK Art. 10 Information Notice'}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
                data-testid="kvkk-layered-close"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>

            <div id={descId} className="p-6 space-y-5 text-sm leading-relaxed">
              <p className="text-slate-300">
                {lang === 'tr'
                  ? 'eCyPro Premium Consulting, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) madde 10 ve Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) madde 13 kapsamındaki aydınlatma yükümlülüğünü, veri toplama anında bu metinle yerine getirir.'
                  : 'Pursuant to article 10 of Turkish Law No. 6698 (KVKK) and article 13 of the EU General Data Protection Regulation (GDPR), eCyPro Premium Consulting discharges its information duty at the point of collection through this notice.'}
              </p>

              <section>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-secondary mb-2">
                  {lang === 'tr' ? '1. Veri Sorumlusu' : '1. Data Controller'}
                </h3>
                <p>
                  eCyPro Premium Consulting — info@ecypro.com — https://www.ecypro.com.{' '}
                  {lang === 'tr'
                    ? 'eCyverse Holding ekosisteminin premium consulting kolu.'
                    : 'The premium consulting arm of the eCyverse Holding ecosystem.'}
                </p>
              </section>

              <section>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-secondary mb-2">
                  {lang === 'tr' ? '2. İşleme Amacı' : '2. Processing Purpose'}
                </h3>
                <p>
                  {lang === 'tr'
                    ? 'Form aracılığıyla iletilen ad, e-posta, şirket ve mesaj verileriniz; talebinizin yanıtlanması, teklif hazırlanması ve sonraki engagement sürecinin yürütülmesi amacıyla işlenir.'
                    : 'Name, email, company, and message data submitted through this form is processed to respond to your request, prepare a proposal, and conduct the subsequent engagement.'}
                </p>
              </section>

              <section>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-secondary mb-2">
                  {lang === 'tr' ? '3. Hukuki Sebep' : '3. Legal Basis'}
                </h3>
                <p>
                  {BASIS_LABEL[basis][lang]} · {GDPR_BASIS[basis]}.
                </p>
              </section>

              <section>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-secondary mb-2">
                  {lang === 'tr' ? '4. Aktarım' : '4. Transfers'}
                </h3>
                <p>
                  {lang === 'tr'
                    ? 'Verileriniz; barındırma (Vercel, Frankfurt AB bölgesi), hata izleme (Sentry) ve e-posta iletimi (Postmark/SendGrid) hizmet sağlayıcılarımıza aktarılır. AB dışı aktarımlar GDPR md.46 standart sözleşme şartları çerçevesinde gerçekleşir.'
                    : 'Your data is transferred to our hosting (Vercel, Frankfurt EU region), error monitoring (Sentry), and email delivery (Postmark/SendGrid) processors. Non-EU transfers are conducted under GDPR art. 46 Standard Contractual Clauses.'}
                </p>
              </section>

              <section>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-secondary mb-2">
                  {lang === 'tr' ? '5. Saklama Süresi' : '5. Retention Period'}
                </h3>
                <p>{retentionText}</p>
              </section>

              <section>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-secondary mb-2">
                  {lang === 'tr' ? '6. Haklarınız' : '6. Your Rights'}
                </h3>
                <p>
                  {lang === 'tr'
                    ? 'KVKK md.11 ve GDPR md.15-22 uyarınca; verilerinize erişme, düzeltme, silme, işlemeye itiraz ve veri taşınabilirliği haklarınızı kullanabilirsiniz. Başvurunuzu info@ecypro.com adresine iletin; en geç 30 gün içinde yanıtlanır.'
                    : 'Under KVKK art. 11 and GDPR art. 15–22, you may exercise your rights to access, rectify, erase, object to processing, and data portability. Send requests to info@ecypro.com; we respond within 30 days at the latest.'}
                </p>
              </section>

              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-3">
                <Link
                  to="/privacy"
                  className="inline-flex items-center gap-1.5 text-secondary text-sm font-medium hover:underline"
                  onClick={close}
                >
                  {lang === 'tr' ? 'Tam Aydınlatma Metni' : 'Full Information Notice'}
                  <ExternalLink size={12} aria-hidden="true" />
                </Link>
                <Link
                  to="/privacy/data-rights"
                  className="inline-flex items-center gap-1.5 text-slate-400 text-sm hover:text-secondary hover:underline"
                  onClick={close}
                >
                  {lang === 'tr' ? 'Veri Hakları Başvurusu' : 'Data Rights Request'}
                  <ExternalLink size={12} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KvkkLayered;
