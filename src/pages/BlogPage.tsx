import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import BlogList from '../components/blog/BlogList';
import { NewsletterSidebar } from '../components/blog/NewsletterSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const BlogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050810] text-slate-300 font-sans selection:bg-blue-500/30 selection:text-white">
      <Helmet>
        <title>Blog & İçgörüler | eCyPro Premium Danışmanlık</title>
        <meta
          name="description"
          content="İş dünyası, dijital dönüşüm ve stratejik yönetim üzerine uzman analizleri ve rehberler."
        />
      </Helmet>

      <Navbar />

      <div className="pt-32 pb-24 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <section data-testid="insights-hero" className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-sm uppercase tracking-widest text-amber-400 mb-4 font-medium">
              Perspektifler & Analiz
            </p>
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-200 to-white">
                Strateji & AI Danışmanlığı İçgörüleri
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Geleceği şekillendiren teknolojiler ve yönetim stratejileri üzerine uzman
              analizlerimiz.{' '}
              <Link to="/services" className="text-secondary hover:underline">
                Danışmanlık hizmetlerimiz →
              </Link>
            </p>
          </section>

          <div className="flex gap-12 items-start">
            <div className="flex-1 min-w-0">
              <BlogList />
            </div>
            <aside className="hidden lg:block w-80 shrink-0">
              <NewsletterSidebar />
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPage;
