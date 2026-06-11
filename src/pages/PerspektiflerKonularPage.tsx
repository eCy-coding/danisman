import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CATEGORIES, TAG_VOCABULARY, TAG_BY_SLUG } from '@/data/taxonomy';
import { ALL_ITEMS } from '@/lib/perspektifler';

/** Full controlled vocabulary, grouped under the category each topic is most
 *  used in (istek.md v2 §PHASE 3e). noindex,follow — thin-content guard. */
const PerspektiflerKonularPage: React.FC = () => {
  const groups = useMemo(() => {
    const tagCategoryUse = new Map<string, Map<string, number>>();
    const tagTotals = new Map<string, number>();
    for (const item of ALL_ITEMS) {
      for (const t of item.tags) {
        tagTotals.set(t, (tagTotals.get(t) ?? 0) + 1);
        const per = tagCategoryUse.get(t) ?? new Map<string, number>();
        per.set(item.categorySlug, (per.get(item.categorySlug) ?? 0) + 1);
        tagCategoryUse.set(t, per);
      }
    }
    const byCategory = new Map<string, { slug: string; label: string; count: number }[]>();
    const unused: { slug: string; label: string; count: number }[] = [];
    for (const tag of TAG_VOCABULARY) {
      const total = tagTotals.get(tag.slug) ?? 0;
      if (total === 0) {
        unused.push({ slug: tag.slug, label: tag.labelTr, count: 0 });
        continue;
      }
      const per = tagCategoryUse.get(tag.slug)!;
      const dominant = [...per.entries()].sort((a, b) => b[1] - a[1])[0]![0];
      const list = byCategory.get(dominant) ?? [];
      list.push({ slug: tag.slug, label: tag.labelTr, count: total });
      byCategory.set(dominant, list);
    }
    for (const list of byCategory.values()) {
      list.sort((a, b) => a.label.localeCompare(b.label, 'tr'));
    }
    return { byCategory, unused };
  }, []);

  return (
    <div className="min-h-screen bg-[#050810] text-slate-300 font-sans">
      <Helmet>
        <title>Tüm Konular | Perspektifler | eCyPro</title>
        <meta name="robots" content="noindex,follow" />
        <meta
          name="description"
          content="Perspektifler konu sözlüğü: kategori başlıkları altında tüm içgörü konuları."
        />
      </Helmet>
      <Navbar />
      <div className="pt-32 pb-24 container mx-auto px-4 max-w-5xl">
        <nav aria-label="breadcrumb" className="text-xs text-slate-500 mb-6">
          <Link to="/perspektifler" className="hover:text-white">
            Perspektifler
          </Link>{' '}
          / <span className="text-slate-300">Tüm Konular</span>
        </nav>
        <h1 className="text-4xl font-serif text-white mb-10">Tüm Konular</h1>

        {CATEGORIES.map((cat) => {
          const topics = groups.byCategory.get(cat.slug);
          if (!topics?.length) return null;
          return (
            <section key={cat.slug} className="mb-10">
              <h2 className="text-lg font-bold text-white mb-4">
                <Link to={`/perspektifler/kategori/${cat.slug}`} className="hover:text-secondary">
                  {cat.label}
                </Link>
              </h2>
              <ul className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <li key={t.slug}>
                    <Link
                      to={`/perspektifler?konu=${t.slug}`}
                      className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:border-white/30 hover:text-white transition"
                    >
                      {t.label} <span className="tabular-nums opacity-60">{t.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {groups.unused.length > 0 && (
          <section className="mt-14 border-t border-white/5 pt-8">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
              Yakında — sözlükte ayrılmış konular
            </h2>
            <ul className="flex flex-wrap gap-2">
              {groups.unused.map((t) => (
                <li
                  key={t.slug}
                  className="rounded-full border border-white/5 px-3 py-1 text-xs text-slate-600"
                >
                  {TAG_BY_SLUG[t.slug]?.labelTr ?? t.slug}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PerspektiflerKonularPage;
