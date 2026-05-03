import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { motion } from 'motion/react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VoicePlayer } from '../components/ui/VoicePlayer';
import { JsonLd } from '../components/seo/JsonLd';
import { getBlogPosts } from '../lib/data';
import { BlogPost } from '../schemas/blog';
import { buildArticleSchema, buildBreadcrumbSchema } from '../lib/structured-data';

const blogPosts = getBlogPosts();

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [Content, setContent] = useState<React.ComponentType | null>(null);
  
  const post = (blogPosts as BlogPost[]).find(p => p.slug === slug);

  useEffect(() => {
    if (slug) {
      // Dynamic import of MDX file
      import(`../content/blog/${slug}.mdx`)
        .then(module => {
          setContent(() => module.default);
        })
        .catch(() => {
          // MDX file may not exist for generated/legacy blog posts — graceful fallback
          setContent(null);
        });
    }
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center text-white">
        <div className="text-center">
            <h1 className="text-3xl font-serif mb-4">Makele Bulunamadı</h1>
            <Link to="/blog" className="text-blue-400 hover:text-blue-300">Blog'a Dön</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral text-slate-300 font-sans">
      <Helmet>
        <title>{post.title} | EcyPro Blog</title>
        <meta name="description" content={post.excerpt} />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:author" content={post.author} />
      </Helmet>

      <JsonLd
        data={buildArticleSchema({
          url: `https://ecypro.com/blog/${post.slug}`,
          title: post.title,
          description: post.excerpt,
          image: post.coverImage,
          publishedAt: new Date(post.date).toISOString(),
          author: post.author,
          category: post.tags?.[0],
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Anasayfa', url: 'https://ecypro.com/' },
          { name: 'Blog', url: 'https://ecypro.com/blog' },
          { name: post.title, url: `https://ecypro.com/blog/${post.slug}` },
        ])}
      />

      <Navbar />

      <div className="pt-32 pb-24 relative">
        <div className="container mx-auto px-4 max-w-4xl">
           <Link to="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Tüm Yazılar
           </Link>

           <motion.article 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
           >
              {/* Header */}
              <header className="mb-12 text-center">
                  <div className="flex items-center justify-center gap-4 text-sm text-slate-400 mb-6">
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-wider text-xs font-bold">
                        {post.tags[0]}
                    </span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(post.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.readingTime}</span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-serif text-white leading-tight mb-8">
                      {post.title}
                  </h1>

                  <div className="relative h-100 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                      <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-linear-to-t from-[#050810] via-transparent to-transparent opacity-60" />
                  </div>
              </header>

              {/* MDX Content */}
              <div className="prose prose-lg prose-invert mx-auto prose-headings:font-serif prose-headings:text-white prose-a:text-blue-400 prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-blockquote:border-l-blue-500 prose-blockquote:bg-white/5 prose-blockquote:p-4 prose-blockquote:rounded-r-lg">
                  {Content ? <Content /> : <div className="text-center py-20">Yükleniyor...</div>}
              </div>

              {/* Author & Share */}
              <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-serif text-xl border-2 border-white/10">
                          {post.author.charAt(0)}
                      </div>
                      <div>
                          <div className="text-white font-semibold">{post.author}</div>
                          <div className="text-xs text-slate-400">Yazar & Stratejist</div>
                      </div>
                  </div>
                  
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors border border-white/10">
                      <Share2 className="w-4 h-4" />
                      Paylaş
                  </button>
              </div>
           </motion.article>
           {post && <VoicePlayer content={`${post.title}. ${post.excerpt}`} />}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
