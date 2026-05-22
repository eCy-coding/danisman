import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define static routes
// NOTE: P15 — privacy/data-rights ve status sitemap'in tek noktasında declare edilir.
//       /antigravity-terminal — eggegg, noindex (sitemap dışı).
const STATIC_ROUTES = [
  '',
  'about',
  'services',
  'pricing',
  'blog',
  'contact',
  'careers',
  'team',
  'partners',
  'industries',
  'methodology',
  'case-studies',
  'events',
  'locations',
  'privacy',
  'privacy/data-rights',
  'terms',
  'cookies',
  'faq',
  'maturity-assessment',
  'quick-check',
  'pricing-calculator',
  // P52: P51 Phase 4 content pages
  'press',
  'speaking',
  'pillar/strategy',
  'pillar/family-business',
  'pillar/operations',
  'pillar/digital-ai',
  'pillar/sustainability-esg',
  'webinars/esg-cbam-2026-readiness',
  'webinars/family-business-transition-2026',
  'industry-reports/turkey-premium-consulting-2026',
];

const BASE_URL = 'https://www.ecypro.com';

async function generateSitemap() {
  console.log('🗺️  Generating Sitemap...');

  // Helper to read dynamic IDs (Basic regex parsing to avoid runtime import issues with icons)
  // We read constants_generated.ts directly as it has the IDs we need.
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const generatedPath = path.resolve(__dirname, '../constants_generated.ts');
  const generatedContent = fs.readFileSync(generatedPath, 'utf-8');

  // Parse generated blog + case slugs (Phase 20.5: switched from id-prefix filter to
  // slug regex so the script captures any naming convention, not just `blog-`/`case-`).
  const generatedSlugs = Array.from(generatedContent.matchAll(/slug:\s*['"]([^'"]+)['"]/g)).map(
    (m) => m[1] as string,
  );

  // Read blog-posts.json (MDX-backed posts) and merge with generated slugs (deduped).
  const blogDataPath = path.resolve(__dirname, '../src/data/blog-posts.json');
  let mdxBlogSlugs: string[] = [];
  if (fs.existsSync(blogDataPath)) {
    const blogPosts = JSON.parse(fs.readFileSync(blogDataPath, 'utf-8')) as { slug: string }[];
    mdxBlogSlugs = blogPosts.map((p) => p.slug);
  }
  const blogSlugs = Array.from(
    new Set([
      ...mdxBlogSlugs,
      ...generatedSlugs.filter(
        (s) =>
          /^[a-z0-9-]+$/.test(s) &&
          !s.startsWith('global-retail') &&
          !s.startsWith('fintech-') &&
          !s.startsWith('vertical-saas') &&
          !s.startsWith('industrial-') &&
          !s.startsWith('hospital-'),
      ),
    ]),
  );

  const serviceSlugs = [
    'strategic-transformation',
    'mergers-acquisitions',
    'family-business',
    'operational-excellence',
    'neuromarketing',
    'hr-transformation',
    'crisis-management',
    'ai-analytics',
    'digital-strategy',
    'data-governance',
    'esg-strategy',
    'investment-incentives',
    'macro-risk',
    'competition-economics',
    'industrial-relations',
    'payroll-audit',
    'employer-branding',
    'market-entry',
    'global-intelligence',
    'smart-cities',
    'government-relations',
  ];

  // P39-T10: Multilingual sitemap with hreflang xhtml:link alternates
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

  // Build date used as <lastmod> for every URL entry — freshness signal for crawlers.
  // Single timestamp per build keeps the file deterministic + diffable.
  const buildDate = new Date().toISOString().split('T')[0];

  // Helper: build a single <url> entry with bilingual hreflang.
  // P15 fix — hreflang URLs MUST match path-based routing (`/tr/<path>`, `/en/<path>`).
  // Legacy `?lang=tr` query-string format conflicts with SeoManager + LocaleRoute,
  // causing Google to crawl URLs that the SPA does not recognize (soft-404 risk).
  const buildUrl = (path: string, changefreq: string, priority: string): string => {
    const cleanPath = path.replace(/^\/+/, '');
    const canonicalUrl = cleanPath ? `${BASE_URL}/${cleanPath}` : BASE_URL;
    const trUrl = cleanPath ? `${BASE_URL}/tr/${cleanPath}` : `${BASE_URL}/tr`;
    const enUrl = cleanPath ? `${BASE_URL}/en/${cleanPath}` : `${BASE_URL}/en`;
    return `
  <url>
    <loc>${canonicalUrl}</loc>
    <xhtml:link rel="alternate" hreflang="tr-TR" href="${trUrl}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />
    <lastmod>${buildDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  };

  let xml = xmlHeader;

  // Add Static Routes
  STATIC_ROUTES.forEach((route) => {
    xml += buildUrl(route, 'weekly', route === '' ? '1.0' : '0.8');
  });

  // Add Blog Posts (MDX + generated; deduped via Set in `blogSlugs`).
  blogSlugs.forEach((slug) => {
    xml += buildUrl(`blog/${slug}`, 'monthly', '0.7');
  });

  // Add Case Study detail pages (slugs imported from mockCaseStudies → single source of truth)
  // Use regex-based parse to keep this script free of runtime imports with icons etc.
  const caseStudiesPath = path.resolve(__dirname, '../src/data/mockCaseStudies.ts');
  let caseSlugs: string[] = [];
  if (fs.existsSync(caseStudiesPath)) {
    const src = fs.readFileSync(caseStudiesPath, 'utf-8');
    caseSlugs = Array.from(src.matchAll(/slug:\s*'([^']+)'/g)).map((m) => m[1]);
  }
  caseSlugs.forEach((slug) => {
    xml += buildUrl(`case-studies/${slug}`, 'monthly', '0.7');
  });

  // Add Services
  serviceSlugs.forEach((slug) => {
    xml += buildUrl(`services/${slug}`, 'weekly', '0.9');
  });

  xml += `
</urlset>`;

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  // ─── P39-T10: Multilingual sitemap split ──────────────────
  // TR sitemap: each URL is /tr/... path
  const buildLocaleSitemap = (locale: 'tr' | 'en'): string => {
    const hreflangSelf = locale === 'tr' ? 'tr-TR' : 'en';
    const hreflangOther = locale === 'tr' ? 'en' : 'tr-TR';
    const selfLang = locale;
    const otherLang = locale === 'tr' ? 'en' : 'tr';

    const xmlLocaleHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    const allPaths: { path: string; changefreq: string; priority: string }[] = [
      ...STATIC_ROUTES.map((r) => ({
        path: r,
        changefreq: 'weekly',
        priority: r === '' ? '1.0' : '0.8',
      })),
      ...blogSlugs.map((s) => ({ path: `blog/${s}`, changefreq: 'monthly', priority: '0.7' })),
      ...caseSlugs.map((s) => ({
        path: `case-studies/${s}`,
        changefreq: 'monthly',
        priority: '0.7',
      })),
      ...serviceSlugs.map((s) => ({
        path: `services/${s}`,
        changefreq: 'weekly',
        priority: '0.9',
      })),
    ];

    const urls = allPaths
      .map(({ path: p, changefreq, priority }) => {
        const selfUrl = `${BASE_URL}/${selfLang}/${p}`.replace(/\/$/, '');
        const otherUrl = `${BASE_URL}/${otherLang}/${p}`.replace(/\/$/, '');
        const defaultUrl = `${BASE_URL}/${p}`.replace(/\/$/, '') || BASE_URL;
        return `
  <url>
    <loc>${selfUrl}</loc>
    <xhtml:link rel="alternate" hreflang="${hreflangSelf}" href="${selfUrl}" />
    <xhtml:link rel="alternate" hreflang="${hreflangOther}" href="${otherUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${defaultUrl}" />
    <lastmod>${buildDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
      })
      .join('');

    return `${xmlLocaleHeader}${urls}
</urlset>`;
  };

  const trSitemap = buildLocaleSitemap('tr');
  const enSitemap = buildLocaleSitemap('en');
  const totalUrls =
    STATIC_ROUTES.length + blogSlugs.length + caseSlugs.length + serviceSlugs.length;
  const now = new Date().toISOString().split('T')[0];

  // Sitemap index — points to all 3 sitemaps
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-tr.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-en.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
  fs.writeFileSync(path.join(publicDir, 'sitemap-tr.xml'), trSitemap);
  fs.writeFileSync(path.join(publicDir, 'sitemap-en.xml'), enSitemap);
  fs.writeFileSync(path.join(publicDir, 'sitemap-index.xml'), sitemapIndex);

  // Robots.txt — production-grade: admin/app/api isolated, sitemaps + security policy ref
  // P43: merge'lendi — admin/app/api disallow + tüm sitemap referansları + security.txt yorum satırı.
  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /app/
Disallow: /api/

Sitemap: ${BASE_URL}/sitemap-index.xml
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-tr.xml
Sitemap: ${BASE_URL}/sitemap-en.xml

# Security policy
# ${BASE_URL}/.well-known/security.txt
`;
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);

  console.log(`✅ Sitemap generated at public/sitemap.xml with ${totalUrls} URLs.`);
  console.log(
    `✅ Locale sitemaps: sitemap-tr.xml (${totalUrls} TR) + sitemap-en.xml (${totalUrls} EN).`,
  );
  console.log(`✅ Sitemap index: sitemap-index.xml → 3 child sitemaps.`);
}

generateSitemap().catch(console.error);
