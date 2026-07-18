import React, { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import BlogCard from '@/components/blog/BlogCard';
import { PerspektiflerFeed } from '@/components/blog/PerspektiflerFeed';
import { CATEGORY_BY_SLUG } from '@/data/taxonomy';
import { PILLAR_INTROS, getStartHere } from '@/data/pillar-content';
import { useTranslation } from '@/lib/i18n';
import { buildCanonical } from '@/i18n/canonical';

/** Category pillar page (istek.md v2 §PHASE 4): intro → "Buradan başlayın"
 *  curated picks → chronological grid with the category pre-locked. */
const PerspektiflerKategoriPage: React.FC = () => {
  const { language } = useTranslation();
  const { slug = '' } = useParams();
  const category = CATEGORY_BY_SLUG[slug];
  const startHere = useMemo(() => (category ? getStartHere(slug) : []), [category, slug]);

  if (!category) {
    return <Navigate to="/perspektifler" replace />;
  }
  const intro = PILLAR_INTROS[slug];

  return (
    <div className="min-h-screen bg-[#050810] text-slate-300 font-sans">
      <Helmet>
        <title>{`${category.label} | Perspektifler | eCyPro`}</title>
        <meta
          name="description"
          content={intro?.seo ?? `${category.label} üzerine eCyPro içgörüleri.`}
        />
        {/* Canonical-collapse fix: hardcoded apex literal ezildi — diğer
            sayfalardaki gibi locale-aware buildCanonical üzerinden. */}
        <link rel="canonical" href={buildCanonical(`/perspektifler/kategori/${slug}`, language)} />
      </Helmet>
      <Navbar />

      <div className="pt-32 pb-24 container mx-auto px-4">
        <nav aria-label="breadcrumb" className="text-xs text-slate-500 mb-6">
          <Link to="/perspektifler" className="hover:text-white">
            Perspektifler
          </Link>{' '}
          / <span className="text-slate-300">{category.label}</span>
        </nav>

        <header className="max-w-3xl mb-12">
          <p className="text-sm uppercase tracking-widest text-amber-400 mb-3 font-medium">
            Kategori
          </p>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">{category.label}</h1>
          {intro && (
            <div data-testid="pillar-intro" className="space-y-4 text-slate-400 leading-relaxed">
              {intro.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </header>

        {startHere.length > 0 && (
          <section aria-labelledby="start-here" className="mb-14">
            <h2 id="start-here" className="text-xl font-bold text-white mb-6">
              Buradan başlayın
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8" role="list">
              {startHere.map((post, i) => (
                <div role="listitem" key={post.slug}>
                  <BlogCard post={post} index={i} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section aria-label={`${category.label} içgörüleri`}>
          <h2 className="text-xl font-bold text-white mb-6">Tüm {category.label} içgörüleri</h2>
          <PerspektiflerFeed lockedCategory={slug} />
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default PerspektiflerKategoriPage;
