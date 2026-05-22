import React, { useState } from 'react';
import { Linkedin, Twitter, Instagram, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../../lib/analytics';
import { useTranslation } from '../../lib/i18n';
import { localizedHref, type Locale } from '../../i18n/helpers';
import { FOOTER_COPY } from '../../constants';
import { CountrySelector } from '../common/CountrySelector';
import { EcyLogo } from '@/components/ui/EcyLogo';

type NewsletterState = { status: 'idle' | 'loading' | 'success' | 'error'; message?: string };

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || '';

export const Footer: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [state, setState] = useState<NewsletterState>({ status: 'idle' });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState({ status: 'loading' });
    trackEvent('Newsletter', 'Subscribe', 'Footer');
    try {
      const base = (API_BASE || '/api').replace(/\/$/, '');
      const endpoint = API_BASE
        ? `${base}/v1/newsletter/subscribe`
        : '/api/v1/newsletter/subscribe';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent, source: 'footer' }),
      });
      const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
      if (!res.ok) {
        setState({ status: 'error', message: data.message || 'Subscription failed' });
        return;
      }
      setState({
        status: 'success',
        message:
          data.code === 'ALREADY_SUBSCRIBED'
            ? lang === 'tr'
              ? 'Zaten aboneydiniz.'
              : 'You are already subscribed.'
            : lang === 'tr'
              ? 'Teşekkürler! Kaydınız onaylandı.'
              : 'Thanks! Your subscription is confirmed.',
      });
      setEmail('');
    } catch {
      setState({
        status: 'error',
        message:
          lang === 'tr' ? 'Ağ hatası, lütfen tekrar deneyin.' : 'Network error, please retry.',
      });
    }
  };

  return (
    <footer
      className="bg-neutral text-white pt-24 pb-12 border-t border-white/5"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-20">
          {/* Column 1: Brand */}
          <div className="space-y-8">
            <Link
              to="/"
              className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
              aria-label="eCyPro Anasayfa"
            >
              <EcyLogo size="md" variant="full" />
            </Link>
            <p className="text-slate-300 text-sm leading-relaxed font-light">
              {FOOTER_COPY.description[lang]}
            </p>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => trackEvent('Social', 'Click', 'LinkedIn')}
                aria-label="LinkedIn"
                className="text-slate-300 hover:text-white transition-colors border border-slate-700 p-3 min-w-11 min-h-11 inline-flex items-center justify-center rounded-full hover:bg-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <Linkedin size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => trackEvent('Social', 'Click', 'Twitter')}
                aria-label="Twitter"
                className="text-slate-300 hover:text-white transition-colors border border-slate-700 p-3 min-w-11 min-h-11 inline-flex items-center justify-center rounded-full hover:bg-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <Twitter size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => trackEvent('Social', 'Click', 'Instagram')}
                aria-label="Instagram"
                className="text-slate-300 hover:text-white transition-colors border border-slate-700 p-3 min-w-11 min-h-11 inline-flex items-center justify-center rounded-full hover:bg-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <Instagram size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Column 2: Hizmetler */}
          <div>
            <h4 className="text-xs font-bold mb-8 text-white uppercase tracking-widest border-b border-white/5 pb-2 inline-block">
              {FOOTER_COPY.servicesTitle[lang]}
            </h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <Link
                  to="/services"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {lang === 'tr' ? 'Tüm Hizmetler' : 'All Services'}
                </Link>
              </li>
              <li>
                <Link
                  to="/industries"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {lang === 'tr' ? 'Sektör Çözümleri' : 'Industry Solutions'}
                </Link>
              </li>
              <li>
                <Link
                  to="/methodology"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {lang === 'tr' ? 'Metodoloji' : 'Methodology'}
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {FOOTER_COPY.events[lang]}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hızlı Linkler */}
          <div>
            <h4 className="text-xs font-bold mb-8 text-white uppercase tracking-widest border-b border-white/5 pb-2 inline-block">
              {FOOTER_COPY.corporateTitle[lang]}
            </h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <Link
                  to="/about"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {lang === 'tr' ? 'Hakkımızda' : 'About Us'}
                </Link>
              </li>
              <li>
                <Link
                  to="/case-studies"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {lang === 'tr' ? 'Başarı Hikayeleri' : 'Case Studies'}
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {FOOTER_COPY.blog[lang]}
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {FOOTER_COPY.careers[lang]}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {lang === 'tr' ? 'İletişim' : 'Contact'}
                </Link>
              </li>
              <li>
                <Link
                  to="/locations"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {FOOTER_COPY.locations[lang]}
                </Link>
              </li>
              {/* Track 4: Lead magnet ücretsiz araçlar */}
              <li>
                <Link
                  to="/quick-check"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                  data-cta-source="footer"
                  data-cta="quick-check"
                  data-track="cta-click"
                >
                  {lang === 'tr'
                    ? 'KVKK Quick-Check (Ücretsiz · 5 dk)'
                    : 'KVKK Quick-Check (Free · 5 min)'}
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing-calculator"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                  data-cta-source="footer"
                  data-cta="pricing-calc"
                  data-track="cta-click"
                >
                  {lang === 'tr'
                    ? 'Pricing Calculator (Ücretsiz · 2 dk)'
                    : 'Pricing Calculator (Free · 2 min)'}
                </Link>
              </li>
              {/* P52: P51 Phase 4 content sayfaları */}
              <li>
                <Link
                  to="/press"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {lang === 'tr' ? 'Basın · Press Kit' : 'Press Kit'}
                </Link>
              </li>
              <li>
                <Link
                  to="/speaking"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {lang === 'tr' ? 'Konuşma Talepleri' : 'Speaking'}
                </Link>
              </li>
              <li>
                <Link
                  to="/pillar/strategy"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {lang === 'tr' ? 'Pillar · Strateji' : 'Pillar · Strategy'}
                </Link>
              </li>
              <li>
                <Link
                  to="/industry-reports/turkey-premium-consulting-2026"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {lang === 'tr' ? 'Industry Report 2026' : 'Industry Report 2026'}
                </Link>
              </li>
              <li>
                <Link
                  to="/quick-check"
                  className="hover:text-secondary transition-colors block min-h-11 py-2 outline-none focus-visible:text-secondary"
                >
                  {lang === 'tr' ? 'Hızlı Değerlendirme' : 'Quick Check'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="text-xs font-bold mb-8 text-white uppercase tracking-widest border-b border-white/5 pb-2 inline-block">
              {FOOTER_COPY.newsletterTitle[lang]}
            </h4>
            <p className="text-slate-300 text-sm mb-6 font-light">
              {FOOTER_COPY.newsletterDesc[lang]}
            </p>
            <form
              className="flex flex-col space-y-3"
              onSubmit={handleSubscribe}
              data-testid="newsletter-form"
              aria-describedby="newsletter-status"
              aria-busy={state.status === 'loading'}
              noValidate
            >
              <label htmlFor="newsletter-email" className="sr-only">
                {FOOTER_COPY.newsletterPlaceholder[lang]}
              </label>
              <input
                type="email"
                id="newsletter-email"
                name="email"
                data-testid="newsletter-email"
                autoComplete="email"
                required
                aria-required="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={FOOTER_COPY.newsletterPlaceholder[lang]}
                disabled={state.status === 'loading' || state.status === 'success'}
                aria-invalid={state.status === 'error' ? true : undefined}
                aria-describedby="newsletter-status"
                className="bg-white/5 border border-white/10 text-white px-5 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-sm transition-all placeholder:text-slate-400 disabled:opacity-60"
              />
              <label className="flex items-start gap-3 text-xs text-slate-400 cursor-pointer select-none min-h-11 py-1">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-secondary w-6 h-6 shrink-0"
                  aria-label={lang === 'tr' ? 'KVKK onayı' : 'Consent'}
                />
                <span>
                  {lang === 'tr'
                    ? 'E-posta tercihlerimin işlenmesine onay veriyorum.'
                    : 'I consent to processing my email preferences.'}
                </span>
              </label>
              <button
                type="submit"
                data-testid="newsletter-submit"
                data-cta="newsletter"
                data-track="cta-click"
                data-cta-source="footer"
                disabled={state.status === 'loading' || state.status === 'success' || !consent}
                className="bg-secondary text-neutral px-5 py-3 rounded-lg text-sm font-bold hover:bg-white hover:text-neutral transition-colors uppercase tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary focus-visible:ring-offset-neutral disabled:opacity-60 disabled:cursor-not-allowed motion-reduce:transition-none"
              >
                {state.status === 'loading'
                  ? lang === 'tr'
                    ? 'Kaydediliyor…'
                    : 'Subscribing…'
                  : FOOTER_COPY.subscribe[lang]}
              </button>
              <div
                id="newsletter-status"
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="min-h-5 text-xs"
              >
                {state.status === 'success' && (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {state.message}
                  </span>
                )}
                {state.status === 'error' && (
                  <span className="inline-flex items-center gap-1 text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    {state.message}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-300 border-t border-ecypro-gold/20 pt-10">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            <span className="text-ecypro-gold font-semibold">eCyPro</span>.{' '}
            {FOOTER_COPY.rights[lang]}
          </p>
          <CountrySelector />
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 md:mt-0 justify-center md:justify-end">
            <Link
              to={localizedHref('/privacy', lang as Locale)}
              className="hover:text-white transition-colors"
            >
              {FOOTER_COPY.privacy[lang]}
            </Link>
            <span className="text-slate-400" aria-hidden="true">
              |
            </span>
            <Link
              to={localizedHref('/terms', lang as Locale)}
              className="hover:text-white transition-colors"
            >
              {lang === 'tr' ? 'Kullanım Koşulları' : 'Terms of Use'}
            </Link>
            <span className="text-slate-400" aria-hidden="true">
              |
            </span>
            <Link
              to={localizedHref('/cookies', lang as Locale)}
              className="hover:text-white transition-colors"
            >
              {FOOTER_COPY.cookies[lang]}
            </Link>
            <span className="text-slate-400" aria-hidden="true">
              |
            </span>
            <Link
              to={localizedHref('/privacy#m10', lang as Locale)}
              className="hover:text-white transition-colors"
              data-testid="kvkk-m10"
            >
              {lang === 'tr' ? 'KVKK m.10 Aydınlatma' : 'KVKK Art.10 Disclosure'}
            </Link>
            <span className="text-slate-400" aria-hidden="true">
              |
            </span>
            <Link
              to={localizedHref('/privacy/data-rights', lang as Locale)}
              className="hover:text-white transition-colors"
              data-testid="kvkk-m11"
            >
              {lang === 'tr' ? 'KVKK m.11 Haklar' : 'KVKK Art.11 Rights'}
            </Link>
            <span className="text-slate-400" aria-hidden="true">
              |
            </span>
            <Link
              to={localizedHref('/quick-check', lang as Locale)}
              className="hover:text-white transition-colors"
              data-testid="quick-check"
            >
              {lang === 'tr' ? 'Quick Check' : 'Quick Check'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
