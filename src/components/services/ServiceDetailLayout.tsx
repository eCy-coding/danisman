/**
 * P47 ServiceDetailLayout — Data-driven 16-section layout for /services/<slug>.
 *
 * Renders ServiceContent (from src/data/service-content.ts) into a structured
 * page: hero / trust badges / problem / outcomes / methodology / deliverables /
 * timeline / investment / trust / FAQ / assessment / related / CTA.
 *
 * If a section's data is missing it gracefully skips (placeholder slugs that
 * don't have full content yet still render hero + skip body).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Target,
  Compass,
  Wrench,
  Sprout,
  Recycle,
  ChevronDown,
  CircleDollarSign,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { ServiceContent } from '../../data/service-content';
import { SERVICES } from '../../data/services';
import { JsonLd } from '../seo/JsonLd';

const PHASE_ICONS: React.ComponentType<{ size?: number; className?: string }>[] = [
  Compass,
  Wrench,
  Sprout,
  Recycle,
  Sparkles,
];

interface ServiceDetailLayoutProps {
  content: ServiceContent;
  // Fallback metadata if content is missing fields
  fallbackTitle: string;
  fallbackDescription: string;
}

export const ServiceDetailLayout: React.FC<ServiceDetailLayoutProps> = ({
  content,
  fallbackTitle,
  fallbackDescription,
}) => {
  const title = content?.hero?.title || fallbackTitle;
  const subtitle = content?.hero?.subtitle || fallbackDescription;
  const valueProp = content?.hero?.valueProp;
  const primaryCta = content?.hero?.primaryCtaText || 'Ücretsiz Strateji Görüşmesi Al';

  // Resolve related services by slug → SERVICES entry
  const relatedServices = (content?.related || [])
    .map((slug) => SERVICES.find((s) => s.link?.endsWith(`/${slug}`)))
    .filter((s): s is (typeof SERVICES)[number] => Boolean(s));

  // Service JSON-LD with offers
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: title,
    provider: {
      '@type': 'Organization',
      name: 'EcyPro Premium Consulting',
      url: 'https://www.ecypro.com',
    },
    areaServed: { '@type': 'Country', name: 'Turkey' },
    description: valueProp || subtitle,
    ...(content?.investment?.range
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'TRY',
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: content.investment.range,
              priceCurrency: 'TRY',
            },
          },
        }
      : {}),
  };

  // FAQ schema for SEO (if FAQ section exists)
  const faqSchema = content?.faq?.items?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: content.faq.items.map((it) => ({
          '@type': 'Question',
          name: it.q,
          acceptedAnswer: { '@type': 'Answer', text: it.a },
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-neutral text-slate-300">
      <JsonLd data={serviceSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-16 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(37,99,235,0.10),transparent)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <nav className="text-sm text-slate-500 mb-6">
            <Link to="/" className="hover:text-secondary">
              Anasayfa
            </Link>{' '}
            <span className="mx-2">/</span>
            <Link to="/services" className="hover:text-secondary">
              Hizmetler
            </Link>{' '}
            <span className="mx-2">/</span>
            <span className="text-slate-300">{title}</span>
          </nav>

          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-[1.1]">
            {title}
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl leading-relaxed mb-6">{subtitle}</p>
          {valueProp && (
            <p className="text-lg text-slate-300 max-w-3xl leading-relaxed mb-10 border-l-4 border-secondary pl-5">
              {valueProp}
            </p>
          )}

          <div className="flex flex-wrap gap-4 items-center mb-10">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
            >
              {primaryCta} <ArrowRight size={18} />
            </Link>
            <Link
              to="/methodology"
              className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
            >
              Metodolojiyi İncele
            </Link>
          </div>

          {/* Trust badges */}
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
            <li className="inline-flex items-center gap-2">
              <Clock size={14} className="text-secondary" /> 5+ yıl pratik
            </li>
            <li className="inline-flex items-center gap-2">
              <Target size={14} className="text-secondary" /> 120+ stratejik karar
            </li>
            <li className="inline-flex items-center gap-2">
              <ShieldCheck size={14} className="text-secondary" /> KVKK & GDPR uyumlu
            </li>
            <li className="inline-flex items-center gap-2">
              <CheckCircle2 size={14} className="text-secondary" /> 24 saat içinde yanıt
            </li>
          </ul>
        </div>
      </section>

      {/* ── Problem ── */}
      {content?.problem?.painPoints?.length ? (
        <section className="py-16 px-6 md:px-12 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-8">
              {content.problem.title}
            </h2>
            <ul className="grid md:grid-cols-2 gap-5">
              {content.problem.painPoints.map((p, i) => (
                <li
                  key={i}
                  className="flex gap-4 p-6 bg-white/5 border border-white/10 rounded-xl"
                >
                  <span className="text-3xl font-serif text-secondary/70 leading-none mt-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-slate-300 leading-relaxed">{p}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── Outcomes ── */}
      {content?.outcomes?.results?.length ? (
        <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-white/2">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-8">
              {content.outcomes.title}
            </h2>
            <ul className="space-y-4">
              {content.outcomes.results.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-4 p-5 bg-emerald-500/5 border-l-4 border-emerald-500/40 rounded-r-xl"
                >
                  <CheckCircle2
                    size={22}
                    className="text-emerald-400 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="text-slate-200 leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── Methodology ── */}
      {content?.methodology?.phases?.length ? (
        <section className="py-16 px-6 md:px-12 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
              {content.methodology.title}
            </h2>
            <p className="text-slate-400 mb-10 max-w-2xl">
              5-katman metodoloji çerçevesinde adım adım engagement akışı.
            </p>
            <div className="space-y-6">
              {content.methodology.phases.map((phase, i) => {
                const Icon = PHASE_ICONS[i % PHASE_ICONS.length] ?? Sparkles;
                return (
                  <div
                    key={i}
                    className="flex flex-col md:flex-row gap-5 p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-colors"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                      <Icon size={22} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{phase.name}</h3>
                        <span className="text-xs uppercase tracking-widest text-slate-500">
                          {phase.duration}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{phase.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Deliverables ── */}
      {content?.deliverables?.artifacts?.length ? (
        <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-white/2">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-8">
              {content.deliverables.title}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {content.deliverables.artifacts.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-5 bg-white/5 border border-white/10 rounded-xl"
                >
                  <Sparkles size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-slate-200 leading-relaxed text-sm">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Timeline + Investment side-by-side ── */}
      {(content?.timeline?.milestones?.length || content?.investment?.range) && (
        <section className="py-16 px-6 md:px-12 border-t border-white/5">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
            {content?.timeline?.milestones?.length ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Calendar size={22} className="text-secondary" />
                  <h2 className="text-2xl font-serif font-bold text-white">
                    Süre & Milestone'lar
                  </h2>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Toplam: <strong className="text-white">{content.timeline.totalDuration}</strong>
                </p>
                <ol className="space-y-3 list-none">
                  {content.timeline.milestones.map((m, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0" />
                      <div>
                        <div className="text-xs uppercase tracking-widest text-slate-500">
                          {m.week}
                        </div>
                        <div className="text-slate-200">{m.name}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {content?.investment?.range ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <CircleDollarSign size={22} className="text-secondary" />
                  <h2 className="text-2xl font-serif font-bold text-white">Yatırım</h2>
                </div>
                <p className="text-3xl font-bold text-white mb-3">{content.investment.range}</p>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  {content.investment.model}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong className="text-slate-300">Ödeme planı:</strong>{' '}
                  {content.investment.paymentPlan}
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-1 mt-5 text-sm text-secondary hover:underline"
                >
                  Tüm paketleri gör <ArrowRight size={14} />
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* ── Trust / Case Study ── */}
      {content?.trust?.anonymizedExample ? (
        <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-white/2">
          <div className="max-w-4xl mx-auto">
            <div className="text-xs font-bold tracking-[0.2em] uppercase text-secondary mb-4">
              Anonim Vaka Örneği
            </div>
            <blockquote className="text-xl md:text-2xl font-serif text-white leading-relaxed border-l-4 border-secondary pl-6 italic">
              "{content.trust.anonymizedExample}"
            </blockquote>
            {content.trust.caseStudySlug && (
              <Link
                to={`/case-studies/${content.trust.caseStudySlug}`}
                className="inline-flex items-center gap-1 mt-6 text-sm text-secondary hover:underline"
              >
                İlgili vaka analizini incele <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </section>
      ) : null}

      {/* ── FAQ ── */}
      {content?.faq?.items?.length ? (
        <section className="py-16 px-6 md:px-12 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-8">
              Sıkça Sorulan Sorular
            </h2>
            <div className="space-y-3">
              {content.faq.items.map((it, i) => (
                <details
                  key={i}
                  className="group bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer hover:border-white/20"
                >
                  <summary className="font-semibold text-white flex justify-between items-start gap-4 list-none">
                    <span>{it.q}</span>
                    <ChevronDown
                      size={18}
                      className="text-secondary flex-shrink-0 mt-1 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-4 text-slate-400 leading-relaxed">{it.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Assessment ── */}
      {content?.assessment?.questions?.length ? (
        <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-white/2">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
              {content.assessment.title}
            </h2>
            <p className="text-slate-400 mb-8">
              Aşağıdaki soruları kendi durumunuza göre evet/hayır olarak değerlendirin.
            </p>
            <ol className="space-y-3 mb-8 list-decimal list-inside text-slate-200">
              {content.assessment.questions.map((q, i) => (
                <li key={i} className="pl-2 leading-relaxed">
                  {q}
                </li>
              ))}
            </ol>
            <div className="p-5 bg-secondary/5 border border-secondary/20 rounded-xl">
              <div className="text-xs font-bold tracking-widest uppercase text-secondary mb-2">
                Skorlama
              </div>
              <p className="text-slate-300 whitespace-pre-line text-sm leading-relaxed">
                {content.assessment.rubric}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Related Services ── */}
      {relatedServices.length ? (
        <section className="py-16 px-6 md:px-12 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-8">
              İlgili Hizmetler
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {relatedServices.map((s) => (
                <Link
                  key={s.id}
                  to={s.link}
                  className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-secondary/30 transition-colors"
                >
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-secondary transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{s.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-secondary">
                    Detayları gör <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── CTA Footer ── */}
      <section className="py-20 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent to-blue-900/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-5">
            Discovery Call ile başlayalım
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            45 dakikalık ücretsiz keşif görüşmesi. Engagement uyumunu birlikte değerlendirelim.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
            >
              Görüşme Planla <ArrowRight size={18} />
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
            >
              Önce Soruları Oku
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
