 

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define static routes
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
  'terms',
  'cookies',
  'faq',
  'login',
  'register',
  'forgot-password'
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
  const blogSlugs = Array.from(new Set([...mdxBlogSlugs, ...generatedSlugs.filter((s) => /^[a-z0-9-]+$/.test(s) && !s.startsWith('global-retail') && !s.startsWith('fintech-') && !s.startsWith('vertical-saas') && !s.startsWith('industrial-') && !s.startsWith('hospital-'))]));

  const serviceSlugs = [
    'strategic-management',
    'human-resources',
    'organizational-behavior',
    'leadership-coaching',
    'municipality-consulting'
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add Static Routes
  STATIC_ROUTES.forEach(route => {
    xml += `
  <url>
    <loc>${BASE_URL}/${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
  });

  // Add Blog Posts (MDX + generated; deduped via Set in `blogSlugs`).
  blogSlugs.forEach(slug => {
    xml += `
  <url>
    <loc>${BASE_URL}/blog/${slug}</loc>
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
    caseSlugs = Array.from(src.matchAll(/slug:\s*'([^']+)'/g)).map(m => m[1]);
  }
  caseSlugs.forEach(slug => {
    xml += `
  <url>
    <loc>${BASE_URL}/case-studies/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  // Add Services
  serviceSlugs.forEach(slug => {
    xml += `
  <url>
    <loc>${BASE_URL}/services/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
  
  // Robots.txt
  const robots = `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);

  const totalUrls = STATIC_ROUTES.length + blogSlugs.length + caseSlugs.length + serviceSlugs.length;
  console.log(`✅ Sitemap generated at public/sitemap.xml with ${totalUrls} URLs.`);
}

generateSitemap().catch(console.error);
