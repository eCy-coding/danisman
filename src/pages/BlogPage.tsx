import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PerspektiflerFeed } from '../components/blog/PerspektiflerFeed';
// NOT (M7): Navbar + Footer MainLayout tarafından sağlanır. Sayfa kendi içinde
// tekrar render ETMEMELİ — aksi halde çift footer + duplike Organization/Person/
// FAQPage JSON-LD oluşuyordu (gerçek-render tanısıyla yakalandı).

/** Perspektifler hub — one H1 system (BUG-06): nav, URL and H1 all say
 *  "Perspektifler". Curated hero + search + facets live in the feed. */
const BlogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050810] text-slate-300 font-sans selection:bg-blue-500/30 selection:text-white">
      <Helmet>
        <title>Perspektifler | eCyPro Premium Danışmanlık</title>
        <meta
          name="description"
          content="Strateji, yapay zeka, finans ve organizasyon üzerine eCyPro içgörüleri: makaleler, vaka analizleri ve founder letter."
        />
        <link rel="canonical" href="https://www.ecypro.com/perspektifler" />
        {/* SEO/GEO: sayfaya-özel OpenGraph + Twitter (önceden genel anasayfa
            og'si geliyordu) + raster og:image (SVG sosyal/LLM önizlemede çoğu
            yerde render edilmiyor). */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.ecypro.com/perspektifler" />
        <meta property="og:title" content="Perspektifler — Strateji & Yapay Zeka İçgörüleri | eCyPro" />
        <meta
          property="og:description"
          content="Strateji, yapay zeka, finans ve organizasyon üzerine eCyPro içgörüleri: makaleler, vaka analizleri ve founder letter."
        />
        <meta property="og:image" content="https://www.ecypro.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Perspektifler — Strateji & Yapay Zeka İçgörüleri | eCyPro" />
        <meta
          name="twitter:description"
          content="Strateji, yapay zeka, finans ve organizasyon üzerine eCyPro içgörüleri."
        />
        <meta name="twitter:image" content="https://www.ecypro.com/og-image.jpg" />
      </Helmet>

      <div className="pt-32 pb-24 relative overflow-hidden">
        {/* Ambient aurora — layered gold+blue, GPU-cheap (pure CSS, no runtime
            cost → LCP-safe). Decorative only. Brand: indigo #2563EB + gold #F59E0B. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[46rem] h-[46rem] rounded-full bg-blue-600/15 blur-[150px]" />
          <div className="absolute -top-12 right-[18%] w-[30rem] h-[30rem] rounded-full bg-amber-500/10 blur-[130px]" />
          <div className="absolute -top-12 left-[16%] w-[24rem] h-[24rem] rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-center opacity-[0.05] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <section data-testid="insights-hero" className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
              Strateji &amp; Yapay Zeka İçgörüleri
            </span>
            <h1 className="font-serif text-5xl md:text-6xl text-white mb-5 tracking-tight text-balance">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-200 via-white to-amber-100">
                Perspektifler
              </span>
            </h1>
            {/* gold hairline accent */}
            <div className="mx-auto mb-6 h-px w-24 bg-linear-to-r from-transparent via-amber-400/60 to-transparent" />
            <p className="text-lg text-slate-300 leading-relaxed text-pretty">
              Geleceği şekillendiren teknolojiler ve yönetim stratejileri üzerine uzman
              analizlerimiz.{' '}
              {/* a11y link-in-text-block: inline link needs a non-color cue. */}
              <Link
                to="/services"
                className="text-secondary underline underline-offset-4 hover:text-amber-300 transition-colors"
              >
                Danışmanlık hizmetlerimiz →
              </Link>
            </p>
          </section>

          <PerspektiflerFeed />
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
