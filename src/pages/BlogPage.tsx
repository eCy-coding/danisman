import React from 'react';
import { Helmet } from 'react-helmet-async';
import BlogList from '../components/blog/BlogList';
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
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-200 to-white">
                İçgörüler ve Perspektifler
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Geleceği şekillendiren teknolojiler ve yönetim stratejileri üzerine uzman
              analizlerimiz.
            </p>
          </div>

          <BlogList />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPage;
