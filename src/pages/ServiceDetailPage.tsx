import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { JsonLd } from '../components/seo/JsonLd';
import { buildServiceSchema, buildBreadcrumbSchema } from '../lib/structured-data';
import { Button } from '../components/ui/Button';
import BlogCard from '@/components/blog/BlogCard';
import { getBlogPosts } from '@/lib/data';
import { ServiceLiveTracker } from '@/components/features/consulting/ServiceLiveTracker';
import { SERVICE_CATEGORIES } from '@/data/content';
import { GENERIC_SERVICE_DETAILS } from '@/data/copy/pages';
import { type MultiLang, getLang } from '@/lib/i18n';

interface ServiceItem {
  id: string;
  title: MultiLang;
  description: MultiLang;
  icon: React.ElementType;
  link: string;
}

export const ServiceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const language = (i18n.language || 'en') as 'tr' | 'en';

  let serviceItem: ServiceItem | null = null;
  let categoryTitle = '';

  // Find service by link matching the slug
  for (const cat of SERVICE_CATEGORIES) {
    const found = cat.items.find((item: { link?: string }) => item.link?.endsWith(`/${slug}`));
    if (found) {
      serviceItem = found as unknown as ServiceItem;
      categoryTitle = getLang(cat.title as MultiLang, language) || '';
      break;
    }
  }

  // Get Related Blog Posts
  const blogPosts = getBlogPosts();
  const relatedPosts = React.useMemo(() => {
    if (!serviceItem) return [];

    // Find category ID
    const parentCategory = SERVICE_CATEGORIES.find((cat) =>
      cat.items.some(
        (item: { title: { en: string } }) => item.title['en'] === serviceItem?.title?.['en'],
      ),
    );
    const categoryId = parentCategory?.id;

    if (!categoryId) return [];

    return blogPosts
      .filter((post: { serviceCategories?: string[]; category?: string }) =>
        post.serviceCategories?.includes(categoryId),
      )
      .slice(0, 3) as import('../schemas/blog').BlogPost[]; // Take top 3
  }, [serviceItem, blogPosts]);

  if (!serviceItem) {
    return <Navigate to="/404" replace />;
  }

  const serviceTitle = getLang(serviceItem.title as MultiLang, language);
  const serviceDesc = getLang(serviceItem.description as MultiLang, language);
  const serviceUrl = `https://www.ecypro.com/services/${slug}`;

  return (
    <div className="min-h-screen bg-neutral flex flex-col font-sans text-slate-300 selection:bg-secondary selection:text-white">
      <Helmet>
        <title>{serviceTitle} | EcyPro</title>
        <meta name="description" content={serviceDesc} />
        <link rel="canonical" href={serviceUrl} />
      </Helmet>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: language === 'tr' ? 'Anasayfa' : 'Home', url: 'https://www.ecypro.com/' },
          {
            name: language === 'tr' ? 'Hizmetler' : 'Services',
            url: 'https://www.ecypro.com/services',
          },
          { name: serviceTitle, url: serviceUrl },
        ])}
      />
      <JsonLd
        data={buildServiceSchema({
          name: serviceTitle,
          description: serviceDesc,
          url: serviceUrl,
          serviceType: categoryTitle,
        })}
      />
      <div className="grow pb-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <Link
            to="/#services"
            className="inline-flex items-center text-slate-400 hover:text-primary transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft size={16} className="mr-2" />
            {t('nav.services')}
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-400 text-sm">{categoryTitle}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Content */}
          <div className="lg:col-span-2 space-y-16">
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center justify-center p-3 bg-primary/20 text-primary rounded-xl mb-6 mr-4">
                  <serviceItem.icon size={32} />
                </div>
                <ServiceLiveTracker
                  serviceId={getLang(serviceItem.title, 'en').toLowerCase().replace(/\s+/g, '-')}
                />
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  {getLang(serviceItem.title, language)}
                </h1>
                <p className="text-xl text-slate-400 leading-relaxed">
                  {getLang(serviceItem.description, language)}
                </p>
              </div>

              <div className="prose prose-invert max-w-none text-slate-400">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {GENERIC_SERVICE_DETAILS.aboutServiceTitle[language]}
                </h3>
                <p className="leading-relaxed mb-8">{GENERIC_SERVICE_DETAILS.intro[language]}</p>

                <div className="glass-card p-6 rounded-2xl my-8">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="text-secondary" size={20} />
                    {GENERIC_SERVICE_DETAILS.benefitsTitle[language]}
                  </h4>
                  <ul className="space-y-3 list-none pl-0 mb-0">
                    {GENERIC_SERVICE_DETAILS.benefits.map((benefit, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2.5 shrink-0"></span>
                        <span>
                          <strong className="text-white">
                            {getLang(benefit.title, language)}:
                          </strong>{' '}
                          {getLang(benefit.desc, language)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <h3 className="text-xl font-bold text-white mt-8 mb-4">
                  {GENERIC_SERVICE_DETAILS.offerTitle[language]}
                </h3>
                <p>{GENERIC_SERVICE_DETAILS.offerDesc[language]}</p>
              </div>
            </div>

            {/* Related Insights Section */}
            {relatedPosts.length > 0 && (
              <div className="border-t border-white/10 pt-12">
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <span className="w-1 h-8 bg-secondary rounded-full"></span>
                  İlgili İçgörüler
                  <span className="text-sm font-normal text-slate-400 ml-auto">
                    Intelligence Hub
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedPosts.map((post, index) => (
                    <div key={post.slug} className="h-full">
                      <BlogCard post={post} index={index} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar CTA */}
          <div className="lg:col-span-1">
            <div className="glass-card p-8 rounded-2xl sticky top-32">
              <h3 className="text-xl font-bold mb-4">
                {GENERIC_SERVICE_DETAILS.ctaTitle[language]}
              </h3>
              <p className="text-slate-400 mb-6 text-sm">
                {GENERIC_SERVICE_DETAILS.ctaDesc[language]}
              </p>
              <Button
                className="w-full justify-center text-lg py-6"
                onClick={() =>
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                {GENERIC_SERVICE_DETAILS.ctaButton[language]}
              </Button>
              <p className="text-xs text-center text-slate-400 mt-4">
                {GENERIC_SERVICE_DETAILS.ctaNote[language]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
