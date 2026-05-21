/**
 * P51.4 — Speaking / Talks page (/speaking).
 *
 * Topic catalog + past engagement (anonim) + inquiry form.
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mic, Calendar, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

const TOPICS = [
  {
    id: 'strategic-leadership',
    title: 'Stratejik Liderlik · Vizyondan Uygulamaya',
    duration: '45-60 dk',
    audience: 'C-level, Yönetim Kurulu',
  },
  {
    id: 'ai-adoption',
    title: 'AI Adoption: ROI Odaklı Use-Case Seçimi',
    duration: '45 dk',
    audience: 'CTO, CDO, Innovation Lead',
  },
  {
    id: 'family-governance',
    title: 'Aile Şirketlerinde 3. Nesil Geçişi',
    duration: '60 dk + Q&A',
    audience: 'Aile holding yönetimi',
  },
  {
    id: 'esg-cbam',
    title: 'CBAM 2026: Türk Üreticisi için ESG Stratejisi',
    duration: '45-60 dk',
    audience: 'CFO, Sustainability Lead',
  },
  {
    id: 'consulting-future',
    title: 'AI Çağında Consulting: Yeni Değer Önerisi',
    duration: '45 dk',
    audience: 'Consulting professionals',
  },
  {
    id: 'turkey-market',
    title: 'Big4 Boşluğunda Premium Boutique Pozisyonu',
    duration: '30 dk + panel',
    audience: 'Strateji direktörleri',
  },
];

const PAST_ENGAGEMENTS = [
  {
    event: 'Bir endüstri zirvesi (anonim)',
    year: '2025',
    topic: 'AI Strategy Panel',
    audience: '350+ executives',
  },
  {
    event: 'Bir banka liderlik off-site',
    year: '2025',
    topic: 'OKR ile Stratejik Uyum',
    audience: '40 senior leaders',
  },
  {
    event: 'Aile şirketleri konferansı (anonim)',
    year: '2024',
    topic: '3. Nesil Geçişi Workshop',
    audience: '120 katılımcı',
  },
];

export const SpeakingPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    org: '',
    event: '',
    topic: '',
    date: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const apiBase = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          message: `Speaking inquiry: ${form.event} (${form.date}) · Konu: ${form.topic}`,
          subject: 'Speaking Inquiry',
          source: 'speaking-page',
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-neutral text-slate-300">
      <Helmet>
        <title>Speaking & Konuşma Talepleri | eCyPro</title>
        <meta
          name="description"
          content="Emre Can Yalçın konuşma konuları + speaking inquiry. AI, strateji, aile şirketi, ESG temaları."
        />
        <link rel="canonical" href="https://www.ecypro.com/speaking" />
      </Helmet>
      <section className="pt-32 pb-12 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3 flex items-center gap-2">
            <Mic size={12} /> Speaking
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
            Konuşma Talepleri
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Konferans, panel, off-site, podcast davet için. AI strategy, family business governance,
            ESG/CBAM, premium consulting pozisyonu temalarında.
          </p>
        </div>
      </section>

      <section className="py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-8">
            Konuşma Konuları
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {TOPICS.map((t) => (
              <article
                key={t.id}
                className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-secondary/30 transition-colors"
              >
                <h3 className="text-lg font-bold text-white mb-3">{t.title}</h3>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>
                    <strong className="text-slate-300">Süre:</strong> {t.duration}
                  </div>
                  <div>
                    <strong className="text-slate-300">Hedef Kitle:</strong> {t.audience}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6 md:px-12 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-8">
            Geçmiş Engagement\'lar
          </h2>
          <ul className="space-y-3">
            {PAST_ENGAGEMENTS.map((e, i) => (
              <li
                key={i}
                className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl"
              >
                <Calendar size={18} className="text-secondary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-white font-semibold">
                    {e.event} <span className="text-xs text-slate-500 font-normal">· {e.year}</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    {e.topic} · {e.audience}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-5 text-center">
            Speaking Inquiry
          </h2>
          <p className="text-slate-400 mb-10 leading-relaxed text-center">
            Etkinlik detaylarınızı paylaşın, 24 saat içinde dönelim.
          </p>
          {status === 'success' ? (
            <div
              className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-emerald-200">
                Talebiniz iletildi. 24 saat içinde dönüş yapacağız.
              </p>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
            >
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Adınız"
                  aria-label="İsim"
                  className="px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@kurum.com"
                  aria-label="E-posta"
                  className="px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <input
                type="text"
                value={form.org}
                onChange={(e) => setForm({ ...form, org: e.target.value })}
                placeholder="Kurum"
                aria-label="Kurum"
                className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <input
                type="text"
                required
                value={form.event}
                onChange={(e) => setForm({ ...form, event: e.target.value })}
                placeholder="Etkinlik Adı / Tipi"
                aria-label="Etkinlik"
                className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <div className="grid md:grid-cols-2 gap-3">
                <select
                  required
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  aria-label="Konu"
                  className="px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Konu seçin</option>
                  {TOPICS.map((t) => (
                    <option key={t.id} value={t.title}>
                      {t.title}
                    </option>
                  ))}
                  <option value="diger">Diğer (mesajda belirtin)</option>
                </select>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  aria-label="Tarih"
                  className="px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full px-6 py-3 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Gönderiliyor
                  </>
                ) : (
                  <>
                    Talep Gönder <ArrowRight size={16} />
                  </>
                )}
              </button>
              {status === 'error' && (
                <p className="text-xs text-red-400" role="alert">
                  Gönderilemedi. Lütfen tekrar deneyin.
                </p>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default SpeakingPage;
