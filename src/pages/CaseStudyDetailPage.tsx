import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Building2, Trophy, Calendar, Target, TrendingUp } from 'lucide-react';
import { CASE_STUDIES } from '@/data/mockCaseStudies';
import { FadeIn } from '../components/common/FadeIn';
import { PageWrapper } from '../components/layout/PageWrapper';
import { JsonLd } from '../components/seo/JsonLd';
import { buildCaseStudySchema, buildBreadcrumbSchema } from '../lib/structured-data';
import { NotFoundPage } from './NotFoundPage';

export const CaseStudyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const study = CASE_STUDIES.find((s) => s.slug === slug);

  if (!study) {
    return <NotFoundPage />;
  }

  const related = CASE_STUDIES.filter((s) => s.slug !== study.slug).slice(0, 2);

  return (
    <React.Fragment>
      <Helmet>
        <title>{`${study.title} | EcyPro Case Study`}</title>
        <meta name="description" content={`${study.title} — ${study.client}. Result: ${study.result}.`} />
        <link rel="canonical" href={`https://ecypro.com/case-studies/${study.slug}`} />
      </Helmet>

      <JsonLd
        data={buildCaseStudySchema({
          url: `https://ecypro.com/case-studies/${study.slug}`,
          title: study.title,
          client: study.client,
          description: `${study.title} — ${study.client}. Result: ${study.result}.`,
          image: study.image ?? 'https://ecypro.com/og-image.jpg',
          category: study.industry,
          goLive: study.goLive,
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Anasayfa', url: 'https://ecypro.com/' },
          { name: 'Case Studies', url: 'https://ecypro.com/case-studies' },
          { name: study.title, url: `https://ecypro.com/case-studies/${study.slug}` },
        ])}
      />

      <PageWrapper className="bg-neutral pt-32 pb-24">
        <article className="max-w-4xl mx-auto px-6">
          <FadeIn>
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-sm text-slate-400">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li aria-hidden="true" className="text-slate-600">/</li>
                <li><Link to="/case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
                <li aria-hidden="true" className="text-slate-600">/</li>
                <li aria-current="page" className="text-white truncate max-w-xs">{study.title}</li>
              </ol>
            </nav>

            <Link
              to="/case-studies"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All case studies</span>
            </Link>

            <div className="flex items-center gap-2 text-sm text-primary font-medium mb-4">
              <Building2 className="w-4 h-4" />
              <span>{study.industry}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 tracking-tight leading-tight">
              {study.title}
            </h1>

            <div className="flex flex-wrap gap-4 mb-10">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{study.client}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 font-semibold">
                <Trophy className="w-4 h-4" />
                <span>{study.result}</span>
              </div>
            </div>
          </FadeIn>

          {study.image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl overflow-hidden border border-white/10 mb-12 aspect-video"
            >
              <img src={study.image} alt={study.title} className="w-full h-full object-cover" loading="lazy" />
            </motion.div>
          )}

          {study.challenge && (
            <p className="text-lg text-slate-300 leading-relaxed mb-12 max-w-3xl">
              {study.challenge}
            </p>
          )}

          {/* KPI strip */}
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Target className="w-5 h-5 text-primary mb-2" />
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Engagement</div>
              <div className="text-lg font-semibold text-white">{study.duration ?? '—'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Calendar className="w-5 h-5 text-primary mb-2" />
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Go-live</div>
              <div className="text-lg font-semibold text-white">{study.goLive ?? '—'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <TrendingUp className="w-5 h-5 text-primary mb-2" />
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Headline</div>
              <div className="text-lg font-semibold text-emerald-400">{study.result}</div>
            </div>
          </div>

          {/* Body content */}
          <div
            className="prose prose-invert prose-lg max-w-none mb-16"
            dangerouslySetInnerHTML={{ __html: study.content }}
          />

          {/* CTA */}
          <div className="rounded-3xl p-8 md:p-10 bg-linear-to-br from-primary/20 via-white/5 to-secondary/10 border border-white/10 text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
              Ready for similar results?
            </h2>
            <p className="text-slate-300 mb-6 max-w-xl mx-auto">
              Book a 15-minute strategy call to see how we can replicate this transformation for your organization.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-neutral font-semibold hover:bg-slate-100 transition-all"
            >
              Book a call
            </Link>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-20" aria-labelledby="related-heading">
              <h2 id="related-heading" className="text-2xl font-serif font-bold text-white mb-6">
                Related case studies
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/case-studies/${r.slug}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-center gap-2 text-xs text-primary mb-2">
                      <Building2 className="w-3 h-3" />
                      <span>{r.industry}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-secondary transition-colors">
                      {r.title}
                    </h3>
                    <div className="mt-3 text-sm text-emerald-400 font-semibold">{r.result}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </PageWrapper>
    </React.Fragment>
  );
};

export default CaseStudyDetailPage;
