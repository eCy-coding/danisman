import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BLOG_POSTS } from '../../constants';
import { FadeIn } from '../common/FadeIn';
import { trackEvent } from '../../lib/analytics';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { MouseGlow } from '../ui/MouseGlow';

const INSIGHTS_COPY = {
  badge: { tr: 'İçgörüler', en: 'Insights' },
  title: { tr: 'Sektörel Bakış Açısı', en: 'Sectoral Perspective' },
  description: { tr: 'Uzman ekibimizin hazırladığı güncel analizler, trend raporları ve stratejik öngörüler.', en: 'Current analyses, trend reports, and strategic foresights prepared by our expert team.' },
  viewAll: { tr: 'Tüm Yazılar', en: 'All Articles' }
};

export const Insights: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  const formatDate = (date: { tr?: string; en: string; es?: string }) => {
    return date[lang as keyof typeof date] || date.en;
  };

  const filteredPosts = BLOG_POSTS.slice(0, 3);

  if (!filteredPosts || filteredPosts.length === 0) {
    return null;
  }

  return (
    <section id="insights" className="py-32 lg:py-48 bg-neutral relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,58,138,0.05),transparent_60%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 lg:mb-24 gap-6">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold tracking-widest uppercase mb-6">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              {INSIGHTS_COPY.badge[lang]}
            </div>
            <h2 id="insights-heading" className="text-h2-d font-sans font-light text-white mb-6 tracking-tight leading-tight">
              {INSIGHTS_COPY.title[lang]}
            </h2>
            <p className="text-slate-400 max-w-2xl text-xl font-light leading-relaxed">
              {INSIGHTS_COPY.description[lang]}
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            <Link
              to="/blog"
              className="hidden md:inline-flex items-center gap-2 px-8 py-4 border border-white/10 text-white text-sm font-medium rounded-full hover:bg-white/5 hover:border-white/20 transition-all backdrop-blur-sm group"
            >
              {INSIGHTS_COPY.viewAll[lang]}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Featured Post (Left) */}
          {filteredPosts[0] && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="lg:col-span-7"
            >
              <Link 
                to={`/blog/${filteredPosts[0].slug}`} 
                className="block h-full group relative rounded-3xl overflow-hidden border border-white/5 bg-white/2 outline-none"
                onClick={() => trackEvent('Blog', 'Read', filteredPosts[0]?.title[lang] || '')}
              >
                <MouseGlow />
                <div className="absolute inset-0 bg-linear-to-t from-neutral via-neutral/50 to-transparent z-10 opacity-80" />
                
                {filteredPosts[0].image && (
                  <img
                    src={filteredPosts[0].image}
                    alt={filteredPosts[0].title[lang]}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                )}
                
                <div className="relative z-20 p-8 lg:p-12 h-full flex flex-col justify-end min-h-100 lg:min-h-125">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">
                    <span className="text-secondary">{filteredPosts[0].category[lang]}</span>
                    <span className="w-1 h-1 rounded-full bg-white/30"></span>
                    <span>{formatDate(filteredPosts[0].date)}</span>
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-sans font-medium text-white mb-4 leading-tight group-hover:text-secondary transition-colors duration-300">
                    {filteredPosts[0].title[lang]}
                  </h3>
                  <p className="text-slate-300 mb-6 line-clamp-2 font-light text-lg lg:max-w-xl">
                    {filteredPosts[0].excerpt[lang]}
                  </p>
                  <span className="inline-flex items-center text-white font-medium group-hover:text-secondary transition-colors">
                    {lang === 'tr' ? 'Makaleyi Oku' : 'Read Article'}
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Stacked Posts (Right) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
            {filteredPosts.slice(1, 3).map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 + (index * 0.1), ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex-1"
              >
                <Link 
                  to={`/blog/${post.slug}`} 
                  className="block h-full group relative rounded-3xl overflow-hidden border border-white/5 bg-white/2 p-8 lg:p-10 outline-none hover:bg-white/4 transition-colors duration-500"
                  onClick={() => trackEvent('Blog', 'Read', post.title[lang])}
                >
                  <MouseGlow />
                  <div className="relative z-10 flex flex-col h-full justify-center">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      <span className="text-secondary">{post.category[lang]}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span>{formatDate(post.date)}</span>
                    </div>
                    <h3 className="text-2xl font-sans font-medium text-white mb-4 leading-tight group-hover:text-secondary transition-colors duration-300">
                      {post.title[lang]}
                    </h3>
                    <p className="text-slate-400 line-clamp-2 font-light mb-6">
                      {post.excerpt[lang]}
                    </p>
                    <span className="mt-auto inline-flex items-center text-white/70 font-medium group-hover:text-secondary transition-colors text-sm">
                      {lang === 'tr' ? 'İncele' : 'Explore'}
                      <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="md:hidden mt-12 text-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-8 py-4 border border-white/10 text-white text-sm font-medium rounded-full hover:bg-white/5 transition-all"
          >
            {INSIGHTS_COPY.viewAll[lang]}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};
