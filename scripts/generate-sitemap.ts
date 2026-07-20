import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CANONICAL_SERVICE_SLUGS } from '../src/data/service-taxonomy';
import {
  groupArticlesForSitemap,
  apexArticleUrls,
  localeArticleUrls,
  type SitemapArticleEntry,
} from '../src/lib/sitemap-article-urls';

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
  // Perspektifler hub + indexable category pillars (konular is noindex — excluded)
  'perspektifler',
  'perspektifler/kategori/strateji',
  'perspektifler/kategori/yapay-zeka-teknoloji',
  'perspektifler/kategori/finans-ekonomi',
  'perspektifler/kategori/insan-organizasyon',
  'perspektifler/kategori/operasyon',
  'perspektifler/kategori/pazarlama-cx',
  'perspektifler/kategori/global-vizyon',
  'perspektifler/kategori/kamu-esg',
  'perspektifler/kategori/liderlik',
  'perspektifler/kategori/ma-degerleme',
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

const BASE_URL = 'https://ecypro.com';

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

  // Read blog-posts.json (MDX-backed posts, lang + pairId aware — EN
  // article-parity mechanism) and merge with generated slugs (deduped).
  // Legacy generated slugs carry no lang/pairId → treated as TR, unpaired.
  const blogDataPath = path.resolve(__dirname, '../src/data/blog-posts.json');
  let mdxBlogEntries: SitemapArticleEntry[] = [];
  if (fs.existsSync(blogDataPath)) {
    const blogPosts = JSON.parse(fs.readFileSync(blogDataPath, 'utf-8')) as {
      slug: string;
      lang?: string;
      pairId?: string;
    }[];
    mdxBlogEntries = blogPosts.map((p) => ({
      slug: p.slug,
      lang: p.lang === 'en' ? 'en' : 'tr',
      pairId: p.pairId,
    }));
  }
  const mdxSlugSet = new Set(mdxBlogEntries.map((p) => p.slug));
  const legacyGeneratedEntries: SitemapArticleEntry[] = generatedSlugs
    .filter(
      (s) =>
        /^[a-z0-9-]+$/.test(s) &&
        !mdxSlugSet.has(s) &&
        !s.startsWith('global-retail') &&
        !s.startsWith('fintech-') &&
        !s.startsWith('vertical-saas') &&
        !s.startsWith('industrial-') &&
        !s.startsWith('hospital-'),
    )
    .map((slug) => ({ slug, lang: 'tr' as const }));

  // EN article-parity mechanism (istek.md v2): all pair/lang URL rules live
  // in src/lib/sitemap-article-urls.ts (unit-tested); this script only
  // renders the derived paths into XML.
  const articleGroups = groupArticlesForSitemap([...mdxBlogEntries, ...legacyGeneratedEntries]);

  // SVC P8 (ADR-services-taxonomy-v2): derived from the taxonomy registry —
  // the old hardcoded 21-slug list shipped 17 URLs that hard-404'd in prod.
  const serviceSlugs = CANONICAL_SERVICE_SLUGS;

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

  // Add Perspektifler articles — pair-aware (EN article-parity): paired
  // articles collapse into ONE entry whose hreflang links point at each
  // sibling's OWN slug; unpaired posts emit only the hreflang side that
  // actually exists (no phantom /en mirror for TR-only posts).
  apexArticleUrls(articleGroups).forEach((a) => {
    const trLink = a.trPath
      ? `\n    <xhtml:link rel="alternate" hreflang="tr-TR" href="${BASE_URL}/${a.trPath}" />`
      : '';
    const enLink = a.enPath
      ? `\n    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/${a.enPath}" />`
      : '';
    xml += `
  <url>
    <loc>${BASE_URL}/${a.loc}</loc>${trLink}${enLink}
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/${a.loc}" />
    <lastmod>${buildDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
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

    // Non-blog routes are locale-symmetric (same slug in both languages) —
    // the generic /tr↔/en swap below is correct for them.
    const allPaths: { path: string; changefreq: string; priority: string }[] = [
      ...STATIC_ROUTES.map((r) => ({
        path: r,
        changefreq: 'weekly',
        priority: r === '' ? '1.0' : '0.8',
      })),
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

    // Perspektifler articles — pair-aware (EN article-parity): a locale's
    // sitemap lists ONLY posts that exist in that language (TR-only posts'
    // /en/... URLs stay OUT of sitemap-en.xml); the opposite-lang hreflang
    // link uses the sibling's OWN slug and is omitted when unpaired.
    const blogUrls = localeArticleUrls(articleGroups, locale)
      .map((a) => {
        const selfUrl = `${BASE_URL}/${a.selfPath}`;
        const otherLink = a.otherPath
          ? `\n    <xhtml:link rel="alternate" hreflang="${hreflangOther}" href="${BASE_URL}/${a.otherPath}" />`
          : '';
        return `
  <url>
    <loc>${selfUrl}</loc>
    <xhtml:link rel="alternate" hreflang="${hreflangSelf}" href="${selfUrl}" />${otherLink}
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/${a.defaultPath}" />
    <lastmod>${buildDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      })
      .join('');

    return `${xmlLocaleHeader}${urls}${blogUrls}
</urlset>`;
  };

  const trSitemap = buildLocaleSitemap('tr');
  const enSitemap = buildLocaleSitemap('en');
  const nonBlogUrls =
    STATIC_ROUTES.length + caseSlugs.length + serviceSlugs.length + COMPETITOR_GAP_ROUTES.length;
  const totalUrls = nonBlogUrls + articleGroups.length;
  const trUrls = nonBlogUrls + localeArticleUrls(articleGroups, 'tr').length;
  const enUrls = nonBlogUrls + localeArticleUrls(articleGroups, 'en').length;
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
  // GEO: AI arama/tarayıcı ajanlarına (GPTBot, ClaudeBot, PerplexityBot,
  // Google-Extended vb.) açık `Allow` bloğu — varsayılan davranış (bunlar
  // `User-agent: *` grubuna zaten dahil) zaten izin verir; bu bloklar niyeti
  // belgeler ve üçüncü parti CDN/WAF seviyesinde yanlış yapılandırmayı önler.
  const AI_CRAWLER_AGENTS = [
    'GPTBot', // OpenAI — arama + model eğitimi
    'ChatGPT-User', // OpenAI — ChatGPT canlı tarama
    'ClaudeBot', // Anthropic — arama + model eğitimi
    'Claude-Web', // Anthropic — Claude canlı tarama
    'PerplexityBot', // Perplexity AI arama
    'Google-Extended', // Google — Gemini/AI Overviews eğitimi
    'CCBot', // Common Crawl — çoğu LLM'in eğitim kaynağı
    'Applebot-Extended', // Apple Intelligence
  ];
  const aiCrawlerBlocks = AI_CRAWLER_AGENTS.map(
    (agent) => `
User-agent: ${agent}
Allow: /
Disallow: /admin/
Disallow: /app/
Disallow: /api/
`,
  ).join('');

  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /app/
Disallow: /api/
${aiCrawlerBlocks}
Sitemap: ${BASE_URL}/sitemap-index.xml
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-tr.xml
Sitemap: ${BASE_URL}/sitemap-en.xml

# Security policy
# ${BASE_URL}/.well-known/security.txt
`;
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);

  console.log(`✅ Sitemap generated at public/sitemap.xml with ${totalUrls} URLs.`);
  console.log(`✅ Locale sitemaps: sitemap-tr.xml (${trUrls} TR) + sitemap-en.xml (${enUrls} EN).`);
  console.log(`✅ Sitemap index: sitemap-index.xml → 3 child sitemaps.`);
}

generateSitemap()
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
