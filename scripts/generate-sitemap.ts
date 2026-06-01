import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define static routes
// NOTE: P15 — privacy/data-rights ve status sitemap'in tek noktasında declare edilir.
//       /antigravity-terminal — eggegg, noindex (sitemap dışı).
const STATIC_ROUTES = [
  '',
  // Sprint 9 P44-T02b — localized TR slug aliases (SEO authority).
  // Foundation slug map: src/i18n/localized-slugs.ts (PR #168).
  // Hreflang via SeoManager.tsx already emits tr/en/x-default per path,
  // so listing both EN canonical + TR alias here gives Google the full
  // bilingual route inventory without duplicate content penalty.
  'about',
  'hakkimizda',
  'services',
  'hizmetler',
  'pricing',
  'fiyatlandirma',
  'blog',
  'contact',
  'iletisim',
  'discovery',
  'careers',
  'kariyer',
  'team',
  'ekip',
  'partners',
  'is-ortaklari',
  'industries',
  'methodology',
  'metodoloji',
  'case-studies',
  'vaka-calismalari',
  'events',
  'etkinlikler',
  'locations',
  'lokasyonlar',
  'privacy',
  'gizlilik',
  'privacy/data-rights',
  'terms',
  'kosullar',
  'cookies',
  'cerezler',
  'faq',
  'sss',
  'maturity-assessment',
  'quick-check',
  'hizli-kontrol',
  'pricing-calculator',
  'fiyatlandirma-hesabi',
  // P52: P51 Phase 4 content pages
  'press',
  'basin',
  'speaking',
  'konusmalar',
  'pillar/strategy',
  'pillar/family-business',
  'pillar/operations',
  'pillar/digital-ai',
  'pillar/sustainability-esg',
  'webinars/esg-cbam-2026-readiness',
  'webinars/family-business-transition-2026',
  'industry-reports/turkey-premium-consulting-2026',
  // Wave-3A: Perspektif (Insights) hub + domain routes
  'insights',
  'insights/archive',
  'insights/search',
  'insights/m-a',
  'insights/esg',
  'insights/fintech',
  'insights/aile-sirketi',
];

// Competitor gap routes with custom priority per spec
const COMPETITOR_GAP_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: 'sektorler', changefreq: 'weekly', priority: '0.9' },
  { path: 'sektorler/imalat-sanayi', changefreq: 'weekly', priority: '0.8' },
  { path: 'sektorler/finansal-hizmetler', changefreq: 'weekly', priority: '0.8' },
  { path: 'sektorler/ilac-saglik', changefreq: 'weekly', priority: '0.8' },
  { path: 'sektorler/perakende-e-ticaret', changefreq: 'weekly', priority: '0.8' },
  { path: 'sektorler/teknoloji-saas', changefreq: 'weekly', priority: '0.8' },
  { path: 'guvence', changefreq: 'monthly', priority: '0.8' },
  { path: 'araclar/denetim-hazirlik-skoru', changefreq: 'monthly', priority: '0.7' },
  { path: 'calismalar', changefreq: 'weekly', priority: '0.7' },
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

  // Add competitor gap routes
  COMPETITOR_GAP_ROUTES.forEach(({ path, changefreq, priority }) => {
    xml += buildUrl(path, changefreq, priority);
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
      ...COMPETITOR_GAP_ROUTES,
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
    STATIC_ROUTES.length +
    blogSlugs.length +
    caseSlugs.length +
    serviceSlugs.length +
    COMPETITOR_GAP_ROUTES.length;
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

// Wave-3A: Insights chunked sitemap generator.
// Reads stub data today; replace with live Prisma query when Wave-1 merges.
async function generateInsightsSitemap() {
  console.log('🗺️  Generating Insights sitemap chunk...');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const stubPath = path.resolve(__dirname, '../src/data/insights-stub-posts.json');

  if (!fs.existsSync(stubPath)) {
    console.warn('⚠️  insights-stub-posts.json not found — skipping insights sitemap.');
    return;
  }

  interface InsightStub {
    slug: string;
    publishedAt: string;
    updatedAt: string;
    primaryDomain: string;
    subDomain: string;
  }

  const posts: InsightStub[] = JSON.parse(fs.readFileSync(stubPath, 'utf-8'));
  const publicDir = path.resolve(__dirname, '../public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Chunk 1 — first 5000 posts (stub has 5)
  const chunk = posts.slice(0, 5000);

  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const urls = chunk
    .map(
      (p) => `
  <url>
    <loc>https://www.ecypro.com/insights/${p.slug}</loc>
    <lastmod>${new Date(p.updatedAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join('');

  const xml = `${xmlHeader}${urls}
</urlset>`;

  fs.writeFileSync(path.join(publicDir, 'sitemap-insights-1.xml'), xml);
  console.log(`✅ sitemap-insights-1.xml written (${chunk.length} URLs).`);

  // Update sitemap-index.xml to include the insights chunk
  const indexPath = path.join(publicDir, 'sitemap-index.xml');
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf-8');
    const insightsEntry = `  <sitemap>
    <loc>https://www.ecypro.com/sitemap-insights-1.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;

    if (!indexContent.includes('sitemap-insights-1.xml')) {
      indexContent = indexContent.replace('</sitemapindex>', `${insightsEntry}\n</sitemapindex>`);
      fs.writeFileSync(indexPath, indexContent);
      console.log('✅ sitemap-index.xml updated with insights chunk entry.');
    }
  }
}

generateSitemap()
  .then(() => generateInsightsSitemap())
  .then(() => {
    // Sync public/ sitemaps → dist/ so prerender reads fresh routes.
    // Vite copies public/ to dist/ before postbuild, so dist/ is stale
    // until we mirror here.
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distDir = path.resolve(__dirname, '../dist');
    const publicDir = path.resolve(__dirname, '../public');
    if (fs.existsSync(distDir)) {
      const files = [
        'sitemap.xml',
        'sitemap-tr.xml',
        'sitemap-en.xml',
        'sitemap-index.xml',
        'sitemap-insights-1.xml',
        'robots.txt',
      ];
      for (const f of files) {
        const src = path.join(publicDir, f);
        const dst = path.join(distDir, f);
        if (fs.existsSync(src)) fs.copyFileSync(src, dst);
      }
      console.log('✅ Sitemaps synced to dist/ for prerender.');
    }
  })
  .catch(console.error);
