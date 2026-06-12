import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PerspektiflerFeed } from '../components/blog/PerspektiflerFeed';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

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
      </Helmet>

      <Navbar />

      <div className="pt-32 pb-24 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <section data-testid="insights-hero" className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-sm uppercase tracking-widest text-amber-400 mb-4 font-medium">
              Strateji & AI Danışmanlığı İçgörüleri
            </p>
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-200 to-white">
                Perspektifler
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Geleceği şekillendiren teknolojiler ve yönetim stratejileri üzerine uzman
              analizlerimiz.{' '}
              {/* a11y link-in-text-block: inline link needs a non-color cue (1.71:1 vs surrounding text). */}
              <Link to="/services" className="text-secondary underline underline-offset-4">
                Danışmanlık hizmetlerimiz →
              </Link>
            </p>
          </section>

          <PerspektiflerFeed />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPage;
