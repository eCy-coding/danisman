/**
 * P51.3 — Webinar landing page.
 *
 * Route: /webinars/:slug (App.tsx integration push sonrası).
 * Şu an sandbox-only — actual webinar data static `WEBINARS` registry, ileride
 * Prisma `Webinar` model'ine taşınabilir.
 *
 * Registration form → POST /api/newsletter/subscribe (re-use endpoint),
 * source: `webinar:<slug>`, additional metadata: webinar_slug, expected_date.
 */

import React, { useState, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { trackFormSubmit } from '../lib/integrations/analytics';
import { useTranslation } from '@/lib/i18n';
import { buildCanonical } from '@/i18n/canonical';

interface Webinar {
  slug: string;
  title: string;
  date: string; // ISO date string
  durationMin: number;
  speakers: string[];
  topic: string;
  audience: string;
  agenda: string[];
  whoFor: string[];
  takeaways: string[];
}

const WEBINARS: Webinar[] = [
  {
    slug: 'esg-cbam-2026-readiness',
    title: 'CBAM 2026: AB İhracatçısı için ESG Hazırlığı',
    date: '2026-06-15T13:00:00.000Z',
    durationMin: 60,
    speakers: ['Emre Can Yalçın'],
    topic: 'ESG · Sürdürülebilirlik',
    audience: 'CFO, Sustainability Lead, Export Manager',
    agenda: [
      'CBAM Kapsamı + 2026 takvimi',
      'Scope 1+2+3 ölçüm metodolojisi',
      'AB Yeşil Mutabakat uyum maliyeti',
      'Yeşil finansman erişim kapısı',
      'Q&A',
    ],
    whoFor: [
      'AB pazarına ihracat yapan üreticiler',
      'Karbon-yoğun sektörler (demir-çelik, çimento, alüminyum)',
      'ESG raporlama hazırlığında olan KOBİ + büyük şirketler',
    ],
    takeaways: [
      'CBAM etki hesaplama Excel şablonu (post-webinar)',
      '5 sektörel benchmark karşılaştırma',
      'AB hibe başvuru takvimi',
    ],
  },
  {
    slug: 'family-business-transition-2026',
    title: 'Aile Şirketinde 3. Nesil Geçişi: Yönetişim Mimarisi',
    date: '2026-07-10T14:00:00.000Z',
    durationMin: 75,
    speakers: ['Emre Can Yalçın'],
    topic: 'Family Business · Governance',
    audience: 'Founder + 2. nesil + 3. nesil aile temsilcileri',
    agenda: [
      'Aile Anayasası anatomy',
      'Family Council vs Yönetim Kurulu sınırı',
      'Succession Planning 3-7 yıllık',
      'Akraba istihdam politikası',
      'Q&A',
    ],
    whoFor: [
      'Kurucu nesilden 2. veya 3. nesle geçen aile şirketleri',
      'Kardeş + kuzen yönetim ekipleri',
      'Aile holdingleri / family office düşünenler',
    ],
    takeaways: [
      'Aile Anayasası şablonu (20 maddelik)',
      'Family Council toplantı şablonu',
      'Succession yol haritası örneği',
    ],
  },
];

export const WebinarLandingPage: React.FC = () => {
  const { language } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const webinar = useMemo(() => WEBINARS.find((w) => w.slug === slug), [slug]);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!webinar) return <Navigate to="/404" replace />;

  const dateObj = new Date(webinar.date);
  const dateFmt = dateObj.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFmt = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error');
      setErrorMsg('Geçerli bir e-posta girin.');
      return;
    }
    if (!consent) {
      setStatus('error');
      setErrorMsg('KVKK aydınlatma metnine açık rıza verin.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    try {
      const apiBase = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: `webinar:${webinar.slug}`,
        }),
      });
      if (res.ok || res.status === 409) {
        setStatus('success');
        trackFormSubmit(`webinar-register-${webinar.slug}`, true);
      } else {
        setStatus('error');
        setErrorMsg('Kayıt başarısız. Tekrar deneyin.');
        trackFormSubmit(`webinar-register-${webinar.slug}`, false);
      }
    } catch {
      setStatus('error');
      setErrorMsg('Bağlantı hatası. Daha sonra deneyin.');
      trackFormSubmit(`webinar-register-${webinar.slug}`, false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral text-slate-300">
      <Helmet>
        <title>{`${webinar.title} | eCyPro Webinar`}</title>
        <meta
          name="description"
          content={`${webinar.title} — ${webinar.speakers.join(', ')} ile ${dateFmt} ${timeFmt}.`}
        />
        <link rel="canonical" href={buildCanonical(`/webinars/${webinar.slug}`, language)} />
      </Helmet>
      <section className="pt-32 pb-12 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
            eCyPro Webinar
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-[1.05]">
            {webinar.title}
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl leading-relaxed">
            {webinar.audience} için 60-75 dk online seans + interaktif Q&A.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Calendar size={16} className="text-secondary" />
              {dateFmt} · {timeFmt}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock size={16} className="text-secondary" />
              {webinar.durationMin} dk
            </span>
            <span className="inline-flex items-center gap-2">
              <Users size={16} className="text-secondary" />
              Konuşmacı: {webinar.speakers.join(', ')}
            </span>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 md:px-12 grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        <div className="md:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-serif font-bold text-white mb-4">Gündem</h2>
            <ul className="space-y-3">
              {webinar.agenda.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-slate-200">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-white mb-4">Kimler İçin?</h2>
            <ul className="space-y-2">
              {webinar.whoFor.map((item, i) => (
                <li key={i} className="text-slate-300 leading-relaxed">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-white mb-4">
              Webinar Sonrası Alacağınız
            </h2>
            <ul className="space-y-2">
              {webinar.takeaways.map((item, i) => (
                <li key={i} className="text-slate-300 leading-relaxed">
                  📎 {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <aside className="md:sticky md:top-32 h-fit p-6 md:p-8 bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl">
          <h3 className="text-lg font-serif font-bold text-white mb-3">Ücretsiz Kayıt</h3>
          <p className="text-sm text-slate-300 mb-5 leading-relaxed">
            Kayıt formunu doldurun, webinar bağlantısı + hatırlatma e-postası gönderilir.
          </p>
          {status === 'success' ? (
            <div
              className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 size={20} className="text-emerald-400 mb-2" />
              <p className="text-emerald-200 text-sm">Kayıt alındı! Bağlantı e-postanıza geldi.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3" noValidate>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@sirket.com"
                required
                aria-required="true"
                disabled={status === 'submitting'}
                className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
              />
              <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-secondary"
                />
                <span className="leading-relaxed">
                  KVKK kapsamında webinar bilgilendirmesi için e-posta işlenmesine açık rıza
                  veriyorum.{' '}
                  <Link to="/privacy/data-rights" className="text-secondary underline">
                    Detay
                  </Link>
                </span>
              </label>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Kaydediliyor
                  </>
                ) : (
                  <>
                    Kayıt Ol <ArrowRight size={16} />
                  </>
                )}
              </button>
              {status === 'error' && errorMsg && (
                <p className="text-xs text-red-400" role="alert">
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </aside>
      </section>
    </div>
  );
};

export default WebinarLandingPage;
