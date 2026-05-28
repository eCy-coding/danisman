import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DATA_PATH = path.resolve(__dirname, '../src/data/blog-posts.json');
const OUTPUT_DIR = path.resolve(__dirname, '../public');
const SITE_URL = 'https://www.ecypro.com';

const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
};

interface Post {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  author: string;
}

const generateRSS = () => {
  console.log('📰 Generating RSS Feed...');

  if (!fs.existsSync(BLOG_DATA_PATH)) {
    console.warn('⚠️ Blog data not found. Skipping RSS generation.');
    return;
  }

  const posts = JSON.parse(fs.readFileSync(BLOG_DATA_PATH, 'utf-8')) as Post[];

  let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>eCyPro Premium Consulting Blog</title>
    <link>${SITE_URL}</link>
    <description>Insights on Strategic Management, Digital Transformation, and Corporate Leadership.</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
`;

  posts.forEach((post) => {
    rss += `
    <item>
        <title>${escapeXml(post.title)}</title>
        <link>${SITE_URL}/blog/${post.slug}</link>
        <guid>${SITE_URL}/blog/${post.slug}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <description>${escapeXml(post.excerpt)}</description>
        <author>info@ecypro.com (${post.author})</author>
    </item>`;
  });

  rss += `
</channel>
</rss>`;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'rss.xml'), rss);
  console.log(`✅ RSS Feed generated at public/rss.xml with ${posts.length} items.`);

  // Track C #1 — Mirror to dist/ when present so the postbuild output
  // reflects the latest content. Vite's static copy stage runs before
  // postbuild, so without this mirror dist/rss.xml stays at the pre-
  // regeneration snapshot and ships stale brand casing.
  const DIST_DIR = path.resolve(__dirname, '../dist');
  if (fs.existsSync(DIST_DIR)) {
    fs.writeFileSync(path.join(DIST_DIR, 'rss.xml'), rss);
    console.log(`✅ RSS Feed mirrored to dist/rss.xml.`);
  }
};

// Wave-3A: Insights RSS feeds (full + per-domain).
// Reads stub data today; replace with live Prisma query when Wave-1 merges.
interface InsightStub {
  slug: string;
  publishedAt: string;
  updatedAt: string;
  primaryDomain: string;
  subDomain: string;
}

const DOMAIN_LABEL: Record<string, string> = {
  M_A: 'Birleşme & Satın Alma',
  ESG: 'ESG & Sürdürülebilirlik',
  FINTECH: 'Fintech & Regülasyon',
  AILE_SIRKETI: 'Aile Şirketi',
};

const DOMAIN_SLUG: Record<string, string> = {
  M_A: 'insights-m-a',
  ESG: 'insights-esg',
  FINTECH: 'insights-fintech',
  AILE_SIRKETI: 'insights-aile-sirketi',
};

const buildInsightsChannel = (title: string, feedHref: string, items: InsightStub[]): string => {
  const itemsXml = items
    .map(
      (p) => `
    <item>
        <title>${escapeXml(p.slug.replace(/-/g, ' '))}</title>
        <link>${SITE_URL}/insights/${p.slug}</link>
        <guid>${SITE_URL}/insights/${p.slug}</guid>
        <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
        <description>${escapeXml(p.subDomain)}</description>
        <author>info@ecypro.com (eCyPro)</author>
        <category>${escapeXml(DOMAIN_LABEL[p.primaryDomain] ?? p.primaryDomain)}</category>
    </item>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>${escapeXml(title)}</title>
    <link>${SITE_URL}</link>
    <description>eCyPro Perspektif — ${escapeXml(title)}</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/${feedHref}" rel="self" type="application/rss+xml" />${itemsXml}
</channel>
</rss>`;
};

const generateInsightsRSS = () => {
  console.log('📰 Generating Insights RSS Feeds...');

  const stubPath = path.resolve(__dirname, '../src/data/insights-stub-posts.json');
  if (!fs.existsSync(stubPath)) {
    console.warn('⚠️  insights-stub-posts.json not found — skipping insights RSS.');
    return;
  }

  const posts: InsightStub[] = JSON.parse(fs.readFileSync(stubPath, 'utf-8'));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Full insights feed
  const fullFeed = buildInsightsChannel('eCyPro Perspektif', 'insights-rss.xml', posts);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'insights-rss.xml'), fullFeed);
  console.log(`✅ insights-rss.xml (${posts.length} items)`);

  // Per-domain feeds
  const domains = ['M_A', 'ESG', 'FINTECH', 'AILE_SIRKETI'];
  for (const domain of domains) {
    const domainPosts = posts.filter((p) => p.primaryDomain === domain);
    const feedSlug = DOMAIN_SLUG[domain];
    const label = DOMAIN_LABEL[domain] ?? domain;
    const feed = buildInsightsChannel(
      `eCyPro Perspektif — ${label}`,
      `${feedSlug}-rss.xml`,
      domainPosts,
    );
    fs.writeFileSync(path.join(OUTPUT_DIR, `${feedSlug}-rss.xml`), feed);
    console.log(`✅ ${feedSlug}-rss.xml (${domainPosts.length} items)`);
  }
};

try {
  generateRSS();
  generateInsightsRSS();
} catch (error) {
  console.error('❌ Error generating RSS feed:', error);
}
